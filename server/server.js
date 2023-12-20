const express = require("express");
const app = express();
const cors = require('cors');
const bodyparser = require('body-parser');
app.use(cors({credentials: true, origin: ['http://localhost:3000', 'http://localhost:8080']}))
app.use(bodyparser.json())
app.set("port", 3001);

// KEYCLOAK
const Keycloak = require('keycloak-connect');

const keycloakConfig = {
  clientId: 'deviantart-backend',
  bearerOnly: true,
  serverUrl: 'http://localhost:8080',
  realm: 'deviantart-realm',
  realmPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkN+2in2ezdWnsF6Y+vRkz+HOqytNdQkGYogPqiX+9699cvxZD4WVBQTnLAP1pAwjoHl4a7OBF8xgW69KHbG/s5k306YsruiK6u4LhkuHeWZikxECSgDmXLflFT1p8G6nPXCWArlOaBsIccAxnb7ENSQg1jPKFERCjOMIAKX1ofQbzRA7eeDCxWdMxS8ZUBHmN7KB8UGhTwHlhv9WRUvLgxKzoHG/WJWpc+Qp4eRfre1iZbjB+R1Kvo8zfLiPZYBwCCn/cBqvzlchLp6VpriW4uulsI1hUPHCeP9TThQjn3/dwAPqwXN1tehzEsEMKapumSK7cg+rSQEMozVnfEkOgwIDAQAB'
};

const keycloak = new Keycloak({}, keycloakConfig);
app.use(keycloak.middleware());


// SSE
const SseChannel = require('sse-channel');
const FactChannel = new SseChannel();
const facts = require('./facts.json').facts;

app.get('/fact', function(req, res) {
  FactChannel.addClient(req, res);
  const fact = facts[Math.floor(Math.random() * facts.length)]
  FactChannel.send((fact.description));
});

setInterval(function broadcastFact() {
  const fact = facts[Math.floor(Math.random() * facts.length)]
  FactChannel.send((fact.description));
}, 10000);


// DATABASE
const neo4j = require('neo4j-driver')
// const driver = neo4j.driver("neo4j://localhost:7687", neo4j.auth.basic('neo4j', 'deviantart'))
const driver = neo4j.driver("bolt://da-db:7687", neo4j.auth.basic("neo4j", "deviantart"));


function DateToObject(date) {
  return {day:date.day.low.toString(), month:date.month.low.toString(), year:date.year.low.toString()}
}
const defaultpfp = 'https://st3.depositphotos.com/6672868/13701/v/600/depositphotos_137014128-stock-illustration-user-profile-icon.jpg'



app.get("/getuserdata", keycloak.protect(), (req, res) => {
  const senderusername = req.kauth.grant.access_token.content.preferred_username
  const senderroles = req.kauth.grant.access_token.content.realm_access.roles || []
  if (senderusername !== req.query.username && !senderroles.includes("app-admin")) {
    return res.status(403).json("Not allowed to get user data")
  }

  const session = driver.session();
  session.run(`optional match (n:User) where n.name='${req.query.username}'return n is not null, n.name, n.pfp`)
  .then(result => {
    const exists = result.records[0]._fields[0]
      if (!exists) {
        const session2 = driver.session();
        session2.run(`create (n:User {name: '${req.query.username}', joined:date(), pfp:'${defaultpfp}', about:'', bc:''}) return n.name, n.pfp`)
          .then(result => {
            console.log(`First time login - created initial user data for ${req.query.username}`)
            const userdata = {
              username:result.records[0]._fields[0],
              pfp:result.records[0]._fields[1],
            }
            res.send(userdata)
            session2.close();
          })
      } else {
        const userdata = {
          username:result.records[0]._fields[1],
          pfp:result.records[0]._fields[2],
        }
        res.send(userdata)
      }
    session.close();
  })
})


// GET PROFILE DATA - for public profile page
app.get("/profiledata", (req, res) => {
  const username = req.query.username
  const session = driver.session();
  session.run(`match (u:User where u.name='${username}') with u optional match (u)-[cr:CREATED]->() with u,count(cr) as images optional match (u)-[l:LIKED]->() with u,images,count(l) as likes optional match ()<-[c:COMMENTED]-(u) with u,images,likes,count(c) as comments return u.about,u.joined, u.pfp, u.bc, images, likes, comments`)
  .then(result => {
    if (result.records.length != 0) {
      const profiledata = {
        username:username,
        about:result.records[0]._fields[0], 
        joined:DateToObject(result.records[0]._fields[1]), 
        pfp:result.records[0]._fields[2], 
        bc:result.records[0]._fields[3], 
        images:result.records[0]._fields[4].low,
        likes:result.records[0]._fields[5].low,
        comments:result.records[0]._fields[6].low 
      }
      res.send(profiledata)
    } else {
      {res.status(400).json("This user doesn't exist!")} 
    }
    session.close();
  })
})

// UPDATE PROFILE
app.put("/updateprofile", keycloak.protect(), (req, res) => {
  const senderusername = req.kauth.grant.access_token.content.preferred_username
  const senderroles = req.kauth.grant.access_token.content.realm_access.roles || []
  if (senderusername !== req.body.username && !senderroles.includes("app-admin")) {
    return res.status(403).json("Not allowed to update user data")
  }

  const session = driver.session();
  session.run(`match (n:User where n.name='${req.body.username}') set n.pfp='${req.body.pfp}' set n.bc='${req.body.bc}' set n.about='${req.body.about}'`)
  .then(result => {
    res.send(JSON.stringify('Profile updated'))
    session.close();
  })
})

// PROFILE IMAGES - all images by this user ordered by date
app.get("/profileimages", (req, res) => {
  const username = req.query.username
  const session = driver.session();
  session.run(`match (n:Image)<-[:CREATED]-(u:User where u.name='${username}') with n,u 
  optional match ()-[l:LIKED]->(n) with n,u,count(l) as likes 
  optional match ()-[c:COMMENTED]->(n) with n,u,likes,count(c) as comments 
  return id(n),n.name,n.url,u.name,u.pfp,likes,comments order by n.date`)
  .then(result => {
    const images = []
    result.records.forEach(r=>{images.push({
      imageid:r._fields[0].low,
      imagename:r._fields[1],
      url:r._fields[2],
      artistname:r._fields[3],
      pfp:r._fields[4],
      likes:r._fields[5].low,
      comments:r._fields[6].low,
    })})
    res.send(images)
    session.close();
  })
})


// GET SEARCH DATA - images and users
app.get("/search", (req, res) => {
  const q = req.query.q
  
  const session = driver.session();
  session.run(`match (n:Image)<-[:CREATED]-(u:User) where toLower(n.name) contains toLower('${q}') or toLower('${q}') in split(toLower(n.description),' ') or '${q}' in n.tags or toLower(u.name) contains toLower('${q}') with n,u 
  optional match ()-[l:LIKED]->(n) with n,u,count(l) as likes 
  optional match ()-[c:COMMENTED]->(n) with n,u,likes,count(c) as comments 
  return id(n),n.name,n.url,u.name,u.pfp,likes,comments order by n.date`)
  .then(result => {
    const images = []
    result.records.forEach(r=>{images.push({
      imageid:r._fields[0].low,
      imagename:r._fields[1],
      url:r._fields[2],
      artistname:r._fields[3],
      pfp:r._fields[4],
      likes:r._fields[5].low,
      comments:r._fields[6].low,
    })})
    const session2 = driver.session();
    session2.run(`match (u:User) where toLower(u.name) contains toLower('${q}') or toLower('${q}') in split(toLower(u.about),' ') return u.name, u.pfp`)
    .then(result2 => {
      const users = []
      result2.records.forEach(r=>{users.push({
        username:r._fields[0],
        pfp:r._fields[1],
      })})
      res.send({Users:users, Images:images})
      session2.close();
      session.close();
    })
  })
})



// GET IMAGE DATA - for public image page
app.get("/imagedata", (req, res) => {
  const imageid = req.query.imageid
  const session = driver.session();
  session.run(`match (n:Image where id(n)=${imageid})<-[:CREATED]-(u:User) with n,u 
  optional match (ul)-[l:LIKED]->(n) with n,u,collect(ul.name) as likes 
  optional match (uc)-[c:COMMENTED]->(n) with n,u,likes,collect([id(c),uc.name,uc.pfp,c.comment,c.date]) as comments 
  return n.name,u.name,u.pfp,n.description,n.tags,n.url,n.created,[com in comments WHERE com[0] is not null],likes`)
  .then(result => {
    if (result.records.length != 0) {
      const imagedata = {
        imageid:imageid,
        imagename:result.records[0]._fields[0], 
        artistname:result.records[0]._fields[1], 
        artistpfp:result.records[0]._fields[2], 
        description:result.records[0]._fields[3], 
        tags:result.records[0]._fields[4], 
        url:result.records[0]._fields[5], 
        created:DateToObject(result.records[0]._fields[6]),
        comments:result.records[0]._fields[7].filter(x=>!x.includes(null)).map(x=>({commentid:x[0].low,'username':x[1],pfp:x[2],comment:x[3],date:DateToObject(x[4])})),
        likes:result.records[0]._fields[8]
      }
      res.send(imagedata)
    } else {
      {res.status(400).json("Could not get image data!")} 
    }
    session.close();
  })
})


// RANDOM IMAGES FOR HOME PAGE - get random images from database
app.get("/randomimageshomepage", (req, res) => {
    const session = driver.session();
    session.run(`match (n:Image)<-[:CREATED]-(u:User) with n,u 
    optional match ()-[l:LIKED]->(n) with n,u,count(l) as likes 
    optional match ()-[c:COMMENTED]->(n) with n,u,likes,count(c) as comments 
    return id(n),n.name,n.url,u.name,u.pfp,likes,comments, rand() as r order by r limit 11`)
    .then(result => {
      if (result.records.length != 0) {
        const images = []
        result.records.forEach(r=>{images.push({
          imageid:r._fields[0].low,
          imagename:r._fields[1],
          url:r._fields[2],
          artistname:r._fields[3],
          pfp:r._fields[4],
          likes:r._fields[5].low,
          comments:r._fields[6].low,
        })})
        res.send(images)
      } else {
        console.log("No random images found!")
        res.send([])
      }
      session.close();
    })
    .catch(e=>console.log(e))
})

// MOST FAVOURITED IMAGES - top 11 favourites
app.get("/topliked", (req, res) => {
  const session = driver.session();
  session.run(`match (n:Image)<-[:CREATED]-(u:User) with n,u 
  optional match ()-[l:LIKED]->(n) with n,u,count(l) as likes 
  optional match ()-[c:COMMENTED]->(n) with n,u,likes,count(c) as comments 
  return id(n),n.name,n.url,u.name,u.pfp,likes,comments order by -likes limit 11`)
  .then(result => {
    if (result.records.length != 0) {
      const images = []
      result.records.forEach(r=>{images.push({
        imageid:r._fields[0].low,
        imagename:r._fields[1],
        url:r._fields[2],
        artistname:r._fields[3],
        pfp:r._fields[4],
        likes:r._fields[5].low,
        comments:r._fields[6].low,
      })})
      res.send(images)
      session.close();
    } else {
      console.log("No top images found!")
      res.send([])
    }
  })
  .catch(e=>console.log(e))
})

// MOST COMMENTED IMAGES - top 11 comments
app.get("/topcommented", (req, res) => {
  const session = driver.session();
  session.run(`match (n:Image)<-[:CREATED]-(u:User) with n,u 
  optional match ()-[l:LIKED]->(n) with n,u,count(l) as likes 
  optional match ()-[c:COMMENTED]->(n) with n,u,likes,count(c) as comments 
  return id(n),n.name,n.url,u.name,u.pfp,likes,comments order by -comments limit 11`)
  .then(result => {
    if (result.records.length != 0) {
      const images = []
      result.records.forEach(r=>{images.push({
        imageid:r._fields[0].low,
        imagename:r._fields[1],
        url:r._fields[2],
        artistname:r._fields[3],
        pfp:r._fields[4],
        likes:r._fields[5].low,
        comments:r._fields[6].low,
      })})
      res.send(images)
      session.close();
    } else {
      console.log("No top images found!")
      res.send([])
    }
  })
  .catch(e=>console.log(e))
})




// RANDOM IMAGES OF THE SAME USER FOR IMAGE PAGE - get random images from database from one user
app.get("/randomuserimages", (req, res) => {
  const imageid = req.query.imageid
  const session = driver.session();
  session.run(`match (n:Image where id(n)=${imageid})<-[:CREATED]-(u:User) match (n2:Image where id(n2)<>${imageid})<-[:CREATED]-(u) return id(n2), n2.url, rand() as r order by r limit 9`)
  .then(result => {
    const images = []
    result.records.forEach(r=>{images.push({imageid:r._fields[0].low, url:r._fields[1]})})
    res.send(images)
    session.close();
  })
})

// SIMILIAR IMAGES - images that share at least one tag with given picture
app.get("/similiarimages", (req, res) => {
  const imageid = req.query.imageid
  const session = driver.session();
  session.run(`match (i:Image where id(i)=${imageid}), (i2:Image where id(i2)<>${imageid})<-[:CREATED]-(u:User) where any(x in i2.tags where x in i.tags) return id(i2), i2.url limit 9`)
  .then(result => {
    const images = []
    result.records.forEach(r=>{images.push({imageid:r._fields[0].low, url:r._fields[1]})})
    res.send(images)
    session.close();
  })
})


// SUBMIT IMAGE - and return imageid to navigate
app.post("/submitimage", keycloak.protect(), (req, res) => {
  const senderusername = req.kauth.grant.access_token.content.preferred_username
  const senderroles = req.kauth.grant.access_token.content.realm_access.roles || []
  if (senderusername !== req.body.username && !senderroles.includes("app-admin")) {
    return res.status(403).json("Not allowed to submit image")
  }

  const session = driver.session();
  const tags = req.body.tags.map(x=>`'${x}'`)
  session.run(`match (u:User where u.name='${req.body.username}') create (n:Image {name: '${req.body.imagename}', description:'${req.body.description}', created:date(), tags:[${tags.join(",")}], url:'${req.body.url}' })<-[:CREATED]-(u) return id(n)`)
  .then(result => {
    if (result.records.length != 0) {
      res.send(JSON.stringify(result.records[0]._fields[0].low))
    } else {
      {res.status(400).json("Failed to submit image!")} 
    }
    session.close();
  })
})

// DELETE IMAGE
app.delete("/deleteimage", keycloak.protect(), (req, res) => {
  const session = driver.session();
  session.run(`match ()-[r]->(n:Image where id(n)=${req.body.imageid}) delete r delete n`)
  .then(result => {
    res.send(JSON.stringify('Image deleted'))
    session.close();
  })
})

// UPDATE IMAGE
app.put("/updateimage", keycloak.protect(), (req, res) => {
  const session = driver.session();
  const tags = req.body.tags.map(x=>`'${x}'`)
  session.run(`match (n:Image where id(n)=${req.body.imageid}) set n.name='${req.body.imagename}' set n.description='${req.body.description}' set n.tags=[${tags.join(",")}]`)
  .then(result => {
    res.send(JSON.stringify('Image updated'))
    session.close();
  })
})


// ADD COMMENT
app.post("/postcomment", keycloak.protect(), (req, res) => {
  const senderusername = req.kauth.grant.access_token.content.preferred_username
  const senderroles = req.kauth.grant.access_token.content.realm_access.roles || []
  if (senderusername !== req.body.username && !senderroles.includes("app-admin")) {
    return res.status(403).json("Not allowed to add comment")
  }

  const session = driver.session();
  session.run(`match (i:Image where id(i)=${req.body.imageid}), (u:User where u.name='${req.body.username}') create (i)<-[r:COMMENTED]-(u) set r.comment='${req.body.comment}' set r.date=date() return id(r),u.name,u.pfp,r.comment,r.date`)
  .then(result => {
    if (result.records.length != 0) {
      const newcomment = {
        commentid:result.records[0]._fields[0].low,
        username:result.records[0]._fields[1],
        pfp:result.records[0]._fields[2],
        comment:result.records[0]._fields[3],
        date:DateToObject(result.records[0]._fields[4]),
      }
      res.send(newcomment)
    } else {
      {res.status(400).json("Failed to post comment!")} 
    }
    session.close();
  })
})

// DELETE COMMENT
app.delete("/deletecomment", keycloak.protect(), (req, res) => {
  const session = driver.session();
  session.run(`match ()-[r:COMMENTED]->() where id(r)=${req.body.commentid} delete r`)
  .then(result => {
    res.send(JSON.stringify('Comment deleted'))
    session.close();
  })
})


// ADD TO OR REMOVE FROM FAVOURITES
app.post("/likedislike", keycloak.protect(), (req, res) => {
  const senderusername = req.kauth.grant.access_token.content.preferred_username
  const senderroles = req.kauth.grant.access_token.content.realm_access.roles || []
  if (senderusername !== req.body.username && !senderroles.includes("app-admin")) {
    return res.status(403).json("Not allowed to submit image")
  }
  
  const session = driver.session();
  const likecypher = `match (u:User where u.name='${req.body.username}'), (n:Image where id(n)=${req.body.imageid}) merge (u)-[:LIKED]->(n)`
  const dislikecypher = `match (u:User where u.name='${req.body.username}')-[r:LIKED]->(n:Image where id(n)=${req.body.imageid}) delete r`
  const cypher = (req.body.action=='like' ? likecypher : dislikecypher)
  session.run(cypher)
  .then(result => {
    res.send(JSON.stringify((cypher == likecypher ? 'liked' : 'disliked')))
    session.close();
  })
})






app.listen(app.get("port"), () => {
  console.log(`Backend Server running: http://localhost:${app.get("port")}/`)
});