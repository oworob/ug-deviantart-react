import { useParams, useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../../App';
import { LoadingPage} from '../Loading';
import TextareaAutosize from 'react-textarea-autosize';
import { useKeycloak } from "@react-keycloak/web";

export function EditProfile() {
    const C = useContext(AppContext);
    const navigate = useNavigate()
    const { username } = useParams();
    const [ProfileData, SetProfileData] = useState([])
    const [Loading, SetLoading] = useState(true)
    const [PFPImageExists, SetPFPImageExists] = useState(true);
    const [ErrorMessage, SetErrorMessage] = useState('');
    const { keycloak } = useKeycloak();

    const url = window.location.pathname.split('/')[1]; //run useffect whenever url (username) changes
    useEffect(() => { //get profile data
        fetch(`http://localhost:3001/profiledata?username=${username}`, 
        {method: 'GET'
        })
          .then(response => {if (!response.ok) {return Promise.reject('That user does not exist!')} else {return response.json()}})
          .then(data => {SetProfileData(data); if (keycloak.authenticated && (C.UserData.username == data.username || keycloak.hasRealmRole("app-admin"))) {SetLoading(false)} else {return Promise.reject('That is not your profile!')}; document.title = `DeviantArt | Editing ${data.username}`})
          .catch(e => {console.log(e); navigate('../') })
      },[url])

      if (Loading) { //to make sure it doesnt try to read undefined image data
        return <LoadingPage/>
    } else {
        return (
        <div id='EditProfile'>  
            <Formik
            initialValues={{about: ProfileData.about, pfp: ProfileData.pfp, bc:ProfileData.bc}}
            validate={values => {
                const errors = {}
                if (values.pfp && !PFPImageExists) {
                    errors.pfp = 'Image could not be loaded!!';
                } 
                if (values.about.length > 600) {
                    errors.about = 'About is too long (maximum 600 characters allowed)!';
                }
                return errors;
            }}
            onSubmit={(values, { setSubmitting }) => {
                fetch(`http://localhost:3001/updateprofile`, 
            {method: 'PUT',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
                body: JSON.stringify({username:username, pfp:values.pfp, bc:values.bc, about:values.about})
            })
                .then(response => {if (!response.ok) {return Promise.reject('Failed to update profile!')} else {return response.json()}})
                .then(data => {navigate('../'+username); setSubmitting(false)})
                .catch(e => {console.log(e); SetErrorMessage(e); setSubmitting(false)})
                }}
            >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
            }) => (<>
{/* TO NIE DZIALA DOKONCZ TO */}
            <div id='header' className='profilebc' style={values.bc!='' ? {'backgroundImage':'url('+values.bc+')', 'backgroundSize':'cover'} : {}}>
                <img src={values.pfp} height={120} id='profilepic' onLoad={(e) => {SetPFPImageExists(true)}} onError={(e) => {SetPFPImageExists(false); e.target.removeAttribute('src') }}></img>
                <div id='info'>
                    <h1>{username}</h1>
                    <div id='stats'>
                        <p>{ProfileData.images} Deviations</p>
                        <p>{ProfileData.likes} Favourites</p>
                        <p>{ProfileData.comments} Comments</p>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
            <h3>Profile Picture</h3>
            <input
                type="text"
                name="pfp"
                id='pfp'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.pfp}
                onFocus={()=>{SetErrorMessage('')}}
                placeholder='Enter the URL containing your profile picture.'
            />
            <p id='error'>{errors.pfp && touched.pfp && errors.pfp}</p>
            <h3>Background</h3>
            <input
                type="text"
                name="bc"
                id='bc'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.bc}
                onFocus={()=>{SetErrorMessage('')}}
                placeholder='Enter the URL containing your background picture.'
            />
            <p id='error'>{errors.bc && touched.bc && errors.bc}</p>
            
            <h3>About Me</h3>
            <TextareaAutosize
                type="text"
                name="about"
                id='about'
                onChange={handleChange}
                onFocus={()=>{SetErrorMessage(false)}}
                onBlur={handleBlur}
                value={values.about}
                placeholder="Introduce yourself to other deviants! Share your background, passions and more."
            />
            <p id='error'>{errors.about && touched.about && errors.about}</p>

            <p id='error'>{ErrorMessage}</p>
            <button type="submit" disabled={isSubmitting} id='submitbutton' className='greenbutton'>
                Update
            </button>
            </form>

            </>)}
            </Formik>
        </div>
        )
    }
}