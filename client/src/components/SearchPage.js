import { ClickableImage } from "./ClickableImage";
import {useEffect, useState} from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { LoadingPage } from "./Loading";


function Gallery(p) {
  return(
    <div className='imagegallery'>
        {p.Images.map((x,i)=> {return <ClickableImage imagedata={x} key={i}/>})}
    </div>
  )
}

function Users(p) {
    return(
      <div id='users'>
          {p.Users.map((x,i)=> {return (
            <Link to={`/${x.username}`} className='hover' key={i}>
                <div id='user'>
                    <img src={x.pfp} height='50' id='profilepic'></img>
                    {x.username}
                </div>
            </Link>
          )})}
      </div>
    )
  }

export function SearchPage() {
  const [ Params ] = useSearchParams();
  const [SearchData, SetSearchData] = useState({})
  const [Loading, SetLoading] = useState(true)
  if (!Params.get('q') || Params.get('q').length == 0) {return (<Navigate replace to="/"/>) }

  useEffect(() => {
    fetch(`http://localhost:3001/search?q=${Params.get('q')}`, 
    {method: 'GET'
    })
      .then(response => response.json())
      .then(data => {SetSearchData(data); SetLoading(false); document.title = `DeviantArt | ${Params.get('q')}`})
      .catch(e => {console.log(e)})
  },[Params.get('q')])

    if (Loading) {return <LoadingPage/> } else {return (
      <div id="Search">
        {SearchData.Users.length == 0 && SearchData.Images.length == 0 ?
            <div id='heading'>
                <p>No results found for</p>
                <p id="bold">{Params.get('q')}</p>
                <p>{':('}</p>
            </div>
            :<div id='heading'>
                <p>Results for</p>
                <p id="bold">{Params.get('q')}</p>
            </div>}
        <div id='result'>
            {SearchData.Users.length > 0? <>
                <div id='line'></div>
                <div id='heading'>
                    <p id="bold">Deviants</p>
                    <p id='count'>{SearchData.Users.length}</p>
                </div>
                <Users Users={SearchData.Users}/>
            </> : null}

            {SearchData.Images.length > 0? <>
                <div id='line'></div>
                <div id='heading'>
                    <p id="bold">Deviations</p>
                    <p id='count'>{SearchData.Images.length}</p>
                </div>
                <Gallery Images={SearchData.Images}/>
            </> : null}
        </div>
      </div>
    )}
  }