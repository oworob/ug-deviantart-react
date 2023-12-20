import { Formik } from 'formik';
import { useState, useContext, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { WithContext as ReactTags } from 'react-tag-input';
import { AppContext } from '../../App';
import { useNavigate, useParams } from 'react-router'
import { LoadingPage} from '../Loading';
import { useKeycloak } from "@react-keycloak/web";

export function EditPage() {
    const C = useContext(AppContext);
    const navigate = useNavigate()
    const { keycloak, initialized } = useKeycloak();
        
    const { imageid } = useParams();
    const [Loading, SetLoading] = useState(true)
    const [ErrorMessage, SetErrorMessage] = useState('');
    const [ImageData, SetImageData] = useState({});
    document.title = 'DeviantArt | Edit'
    
    const url = window.location.pathname.split('/')[2]; //run useffect whenever url (imageid) changes
    useEffect(() => { //imagedata
        fetch(`http://localhost:3001/imagedata?imageid=${imageid}`, 
        {method: 'GET'
        })
          .then(response => {if (!response.ok) {return Promise.reject('That image does not exist!')} else {return response.json()}})
          .then(data => {SetImageData(data); if (keycloak.authenticated && (C.UserData.username == data.artistname || keycloak.hasRealmRole('app-admin'))) {SetLoading(false)} else {return Promise.reject('That image does not belong to you!')}; document.title = `DeviantArt | Editing ${data.imagename}`})
          .catch(e => {console.log(e); navigate('../') })
      },[url])

    if (Loading) { return <LoadingPage/>} else {
    return (
        <div id="Edit">
        <Formik
        initialValues={{ imagename: ImageData.imagename, description: ImageData.description, tags: ImageData.tags.map(x=>({'id':x, 'text':x}))}}
        validate={values => {
            const errors = {}
            if (!values.imagename) {
                errors.imagename = 'Image title is required!';
            } else if (values.imagename > 30) {
                errors.imagename = 'Image title is too long (maximum 30 characters allowed)!';
            }
            if (values.description.length > 300) {
                errors.description = 'Image description is too long (maximum 300 characters allowed)!';
            }
            return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
            fetch(`http://localhost:3001/updateimage`, 
        {method: 'PUT',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
            body: JSON.stringify({imageid:imageid, imagename:values.imagename, description:values.description, tags:values.tags.map(x=>x.text)})
        })
            .then(response => {if (!response.ok) {return Promise.reject('Failed to update the image!')} else {return response.json()}})
            .then(data => {navigate('../image/'+imageid); setSubmitting(false)})
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
        <div id='header'>
            <div id='heading'>
                <p>Edit Your</p>
                <p id="bold">Deviation</p>
            </div>
            <div id='line'></div>
            <img id='image' className='submitimg' src={ImageData.url}></img>
        </div>
        <form onSubmit={handleSubmit}>
            <p>Title</p>
            <input
                type="text"
                name="imagename"
                id='imagename'
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={()=>{SetErrorMessage(false)}}
                value={values.imagename}
                placeholder='Give your deviation a title.'
            />
            <p id='error'>{errors.imagename && touched.imagename && errors.imagename}</p>
            <p>Description</p>
            <TextareaAutosize
                type="text"
                name="description"
                id='description'
                onChange={handleChange}
                onFocus={()=>{SetErrorMessage(false)}}
                onBlur={handleBlur}
                value={values.description}
                placeholder="Introduce your deviation. Tell the backstory, add some intriguing accompanying text, or simply give deviants any extra information you'd like them to know."
            />
            <p id='error'>{errors.description && touched.description && errors.description}</p>
            <p>Tags</p>
            <ReactTags
                name="tags"
                id='tags'
                handleAddition={(tag) => {if (values.tags.length < 30 && /^[a-zA-Z0-9]+$/i.test(tag.text)) {values.tags.push({id:tag.id,text:tag.text.toLowerCase()})}}}
                handleDelete={(i) => {values.tags.splice(i, 1); values.tags.filter((tag, index) => index != i)}}
                tags={values.tags}
                onBlur={handleBlur}
                placeholder='Add up to 30 tags so that other deviants can find your deviation.'
                inputFieldPosition='top'
                delimiters={[9,32,188,13]} // tab,space,comma,enter
                allowDeleteFromEmptyInput={false}
                handleInputFocus={()=>{SetErrorMessage(false)}}
                allowDragDrop={false}
                minQueryLength={2}
                maxLength={20}
                autofocus={false}
            />
            <p id='error'>{ErrorMessage}</p>
            <button type="submit" disabled={isSubmitting} id='submitbutton' className='greenbutton'>
                Update
            </button>
            </form>
        </>)}
        </Formik>
      </div>
    )}

 
}