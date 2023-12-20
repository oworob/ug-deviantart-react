import { Formik } from 'formik';
import { useState, useContext } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { WithContext as ReactTags } from 'react-tag-input';
import { AppContext } from '../../App';
import { useNavigate } from 'react-router'
import { useKeycloak } from "@react-keycloak/web";

export function SubmitPage() {
    const C = useContext(AppContext);
    const navigate = useNavigate()
    const { keycloak, initialized } = useKeycloak();

    if (keycloak.authenticated) {
        
    const [ErrorMessage, SetErrorMessage] = useState('');
    const [ImageExists, SetImageExists] = useState(true);
    document.title = 'DeviantArt | Submit'

    return (
        <div id="Submit">
        <Formik
        initialValues={{ url: '', imagename: '', description: '', tags: []}}
        validate={values => {
            const errors = {};
            if (!values.url) {
                errors.url = 'Image URL is required!';
            } else if (!ImageExists) {
                errors.url = 'Image could not be loaded!'
            }
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
            fetch(`http://localhost:3001/submitimage`, 
        {method: 'POST',
            headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
            body: JSON.stringify({username:C.UserData.username, url:values.url, imagename:values.imagename, description:values.description, tags:values.tags.map(x=>x.text)})
        })
            .then(response => {if (!response.ok) {return Promise.reject('Failed to post the image!')} else {return response.json()}})
            .then(imageid => {navigate('../image/'+imageid); setSubmitting(false)})
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
                <p>Submit a</p>
                <p id="bold">Deviation</p>
            </div>
            <div id='line'></div>
            <img id='image' className='submitimg' src={values.url} onError={(e) => {e.target.removeAttribute('src'); SetImageExists(false)}} onLoad={(e) => {SetImageExists(true)}}></img>
        </div>
        <form onSubmit={handleSubmit}>
            <p>URL</p>
            <input
                type="text"
                name="url"
                id='url'
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.url}
                onFocus={()=>{SetErrorMessage('')}}
                placeholder='Enter the URL containing your deviation.'
            />
            <p id='error'>{errors.url && touched.url && errors.url}</p>
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
                Submit Now
            </button>
            </form>
        </>)}
        </Formik>
      </div>
    )
    } else {
        navigate('/')
    }
}