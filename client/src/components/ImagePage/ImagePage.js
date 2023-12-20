import { Link, useParams, useNavigate } from 'react-router-dom';
import { ClickableImage } from '../ClickableImage'
import { useEffect, useState, useContext, useReducer } from 'react';
import { FaStar, FaCommentAlt, FaDownload, FaTrashAlt, FaPen } from 'react-icons/fa';
import { AppContext } from '../../App';
import { LoadingPage} from '../Loading';
import { CommentForm } from './CommentForm'
import { useKeycloak } from "@react-keycloak/web";


const ImageDataReducer = (state, action) => {
    switch (action.type) {
        case "SET":
            return action.newstate;
        case "LIKE":
            return {...state, likes:[...state.likes,action.username]}
        case "DISLIKE":
            return {...state, likes:[...state.likes].filter(x=>x!=action.username)}
        case "ADDCOMMENT":
            return {...state, comments:([action.newcomment].concat([...state.comments]))}
        case "DELETECOMMENT":
            return {...state, comments:[...state.comments].filter(x=>x.commentid!=action.commentid)}
        default: 
            return state;
    }
}

function GetMonthName(n) {
    const d = new Date();
    d.setMonth(n - 1);
    return d.toLocaleString('en-US', { month: 'short' });
}

function Comment(p) {
    const C = useContext(AppContext)
    const { keycloak, initialized } = useKeycloak();

    return (<div id='comment'>
        <div id='header'>
            <div id='left'>
                <Link to={'../'+p.data.username} id='author' className='hover'>
                    <img src={p.data.pfp} id='profilepic'></img>
                    {p.data.username}
                </Link>
                <p id='date'>{p.data.date.day} {GetMonthName(p.data.date.month)}, {p.data.date.year}</p>
            </div>
            <div id='right'>
                {keycloak.authenticated && (p.data.username == C.UserData.username || keycloak.hasRealmRole('app-admin')) ? <FaTrashAlt className='hover' id='deletecomment' onClick={()=>{
                     fetch(`http://localhost:3001/deletecomment`,
                     {method: 'DELETE',
                        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
                        body: JSON.stringify({commentid:p.data.commentid})
                     })
                       .then(response => response.json())
                       .then(result => {p.DispatchImageData({type:'DELETECOMMENT',commentid:p.data.commentid})})
                }}/> : null}
            </div>
        </div>
        <p id='text'>{p.data.comment}</p>
    </div>)
}

export function ImagePage() {
    const { imageid } = useParams();
    const [Loading, SetLoading] = useState(true)
    const [ImageData, DispatchImageData] = useReducer(ImageDataReducer, {})
    const [SimiliarImages, SetSimiliarImages] = useState([])
    const [MoreByImages, SetMoreByImages] = useState([])
    const [ZoomedIn, SetZoomedIn] = useState(false)
    const C = useContext(AppContext)
    const { keycloak, initialized } = useKeycloak();
    const navigate = useNavigate()

    const url = window.location.pathname.split('/').pop(); //run useffect whenever url (imageid) changes
    useEffect(() => { //imagedata
        fetch(`http://localhost:3001/imagedata?imageid=${imageid}`, 
        {method: 'GET'
        })
          .then(response => {if (!response.ok) {return Promise.reject('That image does not exist!')} else {return response.json()}})
          .then(data => {DispatchImageData({type:'SET',newstate:data}); SetLoading(false); document.title = `DeviantArt | ${data.imagename} by ${data.artistname}`})
          .catch(e => {console.log(e); navigate('../') })
      },[url])

    useEffect(() => { //random images by the same user
        fetch(`http://localhost:3001/randomuserimages?imageid=${imageid}`, 
        {method: 'GET'
        })
          .then(response => response.json())
          .then(data => SetMoreByImages(data))
          .catch(e => {console.log(e)})
      },[url])
      useEffect(() => { //similiar images
        fetch(`http://localhost:3001/similiarimages?imageid=${imageid}`, 
        {method: 'GET'
        })
          .then(response => response.json())
          .then(data => SetSimiliarImages(data))
          .catch(e => {console.log(e)})
      },[url])

    if (Loading) { //to make sure it doesnt try to read undefined image data
        return <LoadingPage/>
    } else {
    return (
        <div id='ImagePage'>
            <div id='left'>
                <img id='image' height={!ZoomedIn ? '360': '600'} src={ImageData.url} style={{'cursor':`${!ZoomedIn ? 'zoom-in': 'zoom-out'}`}} onClick={()=>{SetZoomedIn(!ZoomedIn)}}></img>
                <div id='actions'>
                    <a id='likebutton' className='hover' onClick={()=>{if (!keycloak.authenticated) {keycloak.login()} else {
                         fetch(`http://localhost:3001/likedislike`,
                         {method: 'POST',
                            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
                            body: JSON.stringify({username:C.UserData.username, imageid:imageid, action:(ImageData.likes.includes(C.UserData.username) ? 'dislike' : 'like')})
                         })
                           .then(response => response.json())
                           .then(result => {
                            if (result == 'liked') {
                                DispatchImageData({type:'LIKE',username:C.UserData.username})
                            } else {
                                DispatchImageData({type:'DISLIKE',username:C.UserData.username})
                            }
                        }).catch(e => {console.log(e)})
                    } }}>
                        <FaStar id='icon'/>
                        <p>{ImageData.likes.includes(C.UserData.username) ? 'Remove from Favourites' : 'Add to Favourites'}</p>
                    </a>
                    <div id='rightbuttons'>
                        <a id='downloadbutton' className='hover' href={ImageData.url} download={ImageData.imagename+'By'+ImageData.artistname} target="_blank">
                            <FaDownload id='icon'/>
                            <p>Download</p>
                        </a>
                        {keycloak.authenticated && (C.UserData.username == ImageData.artistname || keycloak.hasRealmRole("app-admin")) ? <>
                            <Link id='editimage' to={`../image/${ImageData.imageid}/edit`} className='hover'> 
                                <FaPen id='icon'/>
                                <p>Edit</p>
                            </Link>
                            <a id='deleteimage' className='hover' onClick={()=>{
                                fetch(`http://localhost:3001/deleteimage`,
                                {method: 'DELETE',
                                    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
                                    body: JSON.stringify({imageid:ImageData.imageid})
                                })
                                .then(response => response.json())
                                .then(result => {
                                    navigate('/')
                                }).catch(e => {console.log(e)})
                            }}>
                                <FaTrashAlt id='icon'/>
                                <p>Delete</p>
                            </a>
                        </>:null}
                    </div>
                </div>
                <div id='underimage'>
                    <div id='main'>
                        <Link to={'../'+ImageData.artistname}><img src={ImageData.artistpfp} id='profilepic'></img></Link>
                        <div id='smallinfo'>
                            <h1 id='title'>{ImageData.imagename}</h1>
                            <div id='artist'>
                                <p>by</p>
                                <Link to={'../'+ImageData.artistname} id='artist' className='hover'>{ImageData.artistname}</Link>
                            </div>
                        </div>
                    </div>
                    <p id='date'>Published: {ImageData.created.day} {GetMonthName(parseInt(ImageData.created.month))}, {ImageData.created.year}</p>
                </div>
                <div id='stats'>
                    <div>
                        <FaStar id='icon'/>
                        <p>{ImageData.likes.length} Favourites</p>
                    </div>
                    <div>
                        <FaCommentAlt id='icon'/>
                        <p>{ImageData.comments.length} Comments</p>
                    </div>
                </div>
                <p id='description'>{ImageData.description}</p>
                <div id='tags'>
                    {ImageData.tags.map((x,i)=>{return <Link to={'../search?q='+x}key={i} id='tag' className='hover'>{x}</Link>})} 
                </div>
                <div id='commentsection'>
                    <p id='title'>Comments</p>
                    <div id='comments'>
                        <CommentForm ImageData={ImageData} UserData={C.UserData} DispatchImageData={DispatchImageData}/>
                        {ImageData.comments.map((x,i)=>{return <Comment data={x} DispatchImageData={DispatchImageData} key={i}/>})}
                    </div>
                </div>
            </div>
            <div id='right'>
                {MoreByImages.length==0 ? null : (<>
                    <p id='title'>More by {ImageData.artistname}</p>
                    <div id='moreby'>
                        {MoreByImages.map((x,i)=>{return <ClickableImage imagedata={x} key={i}/>})}
                    </div>
                </>)}
                {SimiliarImages.length==0 ? null : (<>
                    <p id='title'>You might also like...</p>
                    <div id='similiar'>
                        {SimiliarImages.map((x,i)=>{return <ClickableImage imagedata={x} key={i}/>})}
                    </div>
                </>)}
            </div> 
        </div>
    );
}
}