import { Link, useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { AppContext } from '../App'
import { useKeycloak } from "@react-keycloak/web";

import LogoImage from './Images/Logo.png';

function SearchBox() {
    const navigate = useNavigate()
    const [SearchQuery, SetQuery] = useState("");
    return (
        <form id='searchbox' onSubmit={(e)=>{e.preventDefault(); if (SearchQuery.length > 0) {navigate({pathname:`/search`,search:`?q=${SearchQuery}`})}}}>
            <FaSearch/>
            <input type='text' placeholder='Search' value={SearchQuery} onChange={(e)=>{SetQuery(e.target.value)}}></input>
        </form>
    )
}
function Logo() {
    return (
        <div id='logo'>
            <Link to="">
                <img src={LogoImage} height={25}></img>
            </Link>
        </div>
    )
}


export function Nav() {
    const C = useContext(AppContext);
    const { keycloak } = useKeycloak();

    if (keycloak.authenticated) {
        return (
            <nav id="Nav">
             <Logo/>
              <SearchBox/>
              <Link to={"/"+C.UserData.username} id='profile' className='hover'>
                <img src={C.UserData.pfp} height={33} id='profilepic'></img>
                <p>{C.UserData.username}</p>
              </Link>
              <Link to="submit">
                  <div id='SubmitButton' className='greenbutton'>
                      <FaPlus/>
                      <button>Submit</button>
                  </div>
              </Link>
            </nav>
          );
    } else { //not logged in -> change navbar
        return (
            <nav id="Nav">
              <Logo/>
              <SearchBox/>
                  <div id='login' className='greenbutton' onClick={keycloak.login}>
                      Log In
                  </div>
            </nav>
          );
    }
    
  }