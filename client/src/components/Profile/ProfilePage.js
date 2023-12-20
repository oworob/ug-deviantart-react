import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react'
import { LoadingPage } from '../Loading';
import { ClickableImage } from '../ClickableImage';
import { AppContext } from '../../App';
import { useKeycloak } from "@react-keycloak/web";

function GetMonthName(n) {
    const d = new Date();
    d.setMonth(n - 1);
    return d.toLocaleString('en-US', { month: 'short' });
}


export function ProfilePage() {
    const { username } = useParams();
    const [ProfileData, SetProfileData] = useState([])
    const [ProfileImages, SetProfileImages] = useState([])
    const [Loading, SetLoading] = useState(true)
    const navigate = useNavigate()
    const C = useContext(AppContext)
    const { keycloak } = useKeycloak();

    const url = window.location.pathname.split('/').pop(); //run useffect whenever url (username) changes
    useEffect(() => { //get profile data
        fetch(`http://localhost:3001/profiledata?username=${username}`, 
        {method: 'GET'
        })
          .then(response => {if (!response.ok) {return Promise.reject('That user does not exist!')} else {return response.json()}})
          .then(data => {SetProfileData(data); SetLoading(false); document.title = `DeviantArt | ${data.username}`})
          .catch(e => {console.log(e); navigate('../') })
      },[url])

      useEffect(() => { //get images by this user
        fetch(`http://localhost:3001/profileimages?username=${username}`, 
        {method: 'GET'
        })
          .then(response => response.json())
          .then(data => {SetProfileImages(data)})
      },[])

      if (Loading) { //to make sure it doesnt try to read undefined image data
        return <LoadingPage/>
    } else {
        return (
        <div id='Profile'>  
            <div id='header' className='profilebc' style={ProfileData.bc!=null ? {'backgroundImage':'url('+ProfileData.bc+')', 'backgroundSize':'cover'} : {}}>
                <img src={ProfileData.pfp} height={120} id='profilepic'></img>
                <div id='info'>
                    <h1>{username}</h1>
                    <div id='stats'>
                        <p>{ProfileData.images} Deviations</p>
                        <p>{ProfileData.likes} Favourites</p>
                        <p>{ProfileData.comments} Comments</p>
                    </div>
                </div>
            </div>
            <div id='about'>
                <div id='top'>
                    <h3>About Me</h3>
                    {keycloak.authenticated && (username == C.UserData.username || keycloak.hasRealmRole("app-admin")) ?
                        <div id='rightbuttons'>
                            <Link to={'edit'} className='hover'><h3>Edit Profile</h3></Link>
                            {username == C.UserData.username ? // logout button only for the logged in user
                                <h3 className='hover' onClick={()=>{keycloak.logout()}}>Log Out</h3>
                            : null }
                        </div> : null }
                </div>
                <div id='block'>
                    <p id='date'>Joined {ProfileData.joined.day} {GetMonthName(ProfileData.joined.month)} {ProfileData.joined.year}</p>
                    <p id='content'>{ProfileData.about}</p>
                </div>
            </div>
            <div id='gallery'>
            {ProfileImages.length > 0 ? <>
                <h3>My Deviations</h3>
                <div className='imagegallery'>
                    {ProfileImages.map((x,i)=> {return <ClickableImage imagedata={x}  key={i}/>})}
                </div></>: null}
            </div> 
        </div>
        )
    }
}