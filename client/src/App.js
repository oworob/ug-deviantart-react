import './style.scss';
import { createContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useKeycloak } from "@react-keycloak/web";

import { Nav } from './components/Nav';
import { NotFound } from './components/NotFound';
import { Home } from './components/Home';
import { ProfilePage } from './components/Profile/ProfilePage';
import { ImagePage } from './components/ImagePage/ImagePage'
import { SubmitPage } from './components/SubmitEdit/SubmitPage'
import { SearchPage } from './components/SearchPage';
import { EditPage } from './components/SubmitEdit/EditPage';
import { EditProfile } from './components/Profile/EditProfile';

export const AppContext = createContext();

export default function App() {
  const [UserData, SetUserData] = useState({});
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (keycloak.authenticated) {
      keycloak.loadUserProfile().then((data) => {
        fetch(`http://localhost:3001/getuserdata?username=${data.username}`, 
        {method: 'GET',  headers: {Authorization: `Bearer ${keycloak.token}`}})
          .then(response => response.json())
          .then(data => {SetUserData(data)})
        }).catch((err) => console.log(err))
      }
    } ,[initialized])
    
  return (
      <div id="App">
          <AppContext.Provider
            value={{
              UserData,
              SetUserData
            }}
          >
            <Nav/>
            <Routes>
              <Route path='' element={<Home/>}/>
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/image/:imageid" element={<ImagePage/>} />
              <Route path="/image/:imageid/edit" element={<EditPage/>} />
              <Route path="/search" element={<SearchPage/>} />
              <Route path="/:username" element={<ProfilePage/>} />
              <Route path="/:username/edit" element={<EditProfile/>} />
              <Route path='*' element={<NotFound/>}/>
            </Routes>
          </AppContext.Provider>
      </div>
  );
}

