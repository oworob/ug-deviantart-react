import { Formik } from 'formik';
import { Link } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import { useKeycloak } from "@react-keycloak/web";

export function CommentForm(p) {
    const { keycloak, initialized } = useKeycloak();
    if (keycloak.authenticated) {
    return (
        <div id='commentform'>
            <Formik
                initialValues={{ comment: ''}}
                validate={values => {
                    const errors = {};
                    if (!values.comment) {
                        errors.comment = 'Field cannot be empty!';
                    }
                    return errors;
                }}
                onSubmit={(values, { setSubmitting, resetForm }) => {
                    fetch(`http://localhost:3001/postcomment`, 
                {method: 'POST',
                    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${keycloak.token}`},
                    body: JSON.stringify({imageid:p.ImageData.imageid, username:p.UserData.username, comment:values.comment})
                })
                    .then(response => {if (!response.ok) {return Promise.reject('Failed to post the comment.')} else {return response.json()}})
                    .then(newcomment => {p.DispatchImageData({type:'ADDCOMMENT',newcomment:newcomment}); resetForm(); setSubmitting(false)})
                    .catch(e => {console.log(e); setSubmitting(false)})
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
                }) => (
                    <form onSubmit={handleSubmit}>
                    <TextareaAutosize
                        type="text"
                        name="comment"
                        id='comment'
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.comment}
                        placeholder='Add a new comment...'
                    />
                    <button type="submit" disabled={isSubmitting} className='greenbutton' id='submit'>
                        Submit
                    </button>
                    </form>
                )}
            </Formik>
        </div>
    )
    } else {
        return (
            <div id='mustlogin'>
                <a className='hover' onClick={keycloak.register}>Join the community</a>
                to add your comment. Already a Deviant?
                <a className='hover' onClick={keycloak.login}>Log in</a>
            </div>
        )
    }
}