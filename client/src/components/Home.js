import { ClickableImage } from "./ClickableImage";
import {useEffect, useState} from 'react';
 

function Gallery(p) {
  return(
    <div className='imagegallery'>
        {p.Images.map((x,i)=> {return <ClickableImage imagedata={x} key={i}/>})}
    </div>
  )
}

export function Home() {
  const [RandomImages, SetRandomImages] = useState([])
  useEffect(() => {
    fetch(`http://localhost:3001/randomimageshomepage`, 
    {method: 'GET'
    })
      .then(response => response.json())
      .then(data => SetRandomImages(data))
  },[])
  const [TopLikedImages, SetTopLikedImages] = useState([])
  useEffect(() => {
    fetch(`http://localhost:3001/topliked`, 
    {method: 'GET'
    })
      .then(response => response.json())
      .then(data => SetTopLikedImages(data))
  },[])
  const [TopCommentedImages, SetTopCommentedImages] = useState([])
  useEffect(() => {
    fetch(`http://localhost:3001/topcommented`, 
    {method: 'GET'
    })
      .then(response => response.json())
      .then(data => SetTopCommentedImages(data))
  },[])
  document.title = 'DeviantArt | Home'

  const [Fact, SetFact] = useState('')
  useEffect(() => {
    const sse = new EventSource('http://localhost:3001/fact',
      { withCredentials: true });
    sse.onmessage = (e) => {SetFact(e.data);};
    sse.onerror = () => {
      console.log('SSE failed')
      sse.close();
    }
    return () => {
      sse.close();
    };
  }, []);

    return (
      <div id="Home">
        <div id='facts'>
          <p id='bold'>Did you know?</p>
          <p id='fact'>{Fact}</p>
        </div>
        <div id='line'></div>
        <div id='heading'>
          <p>Explore</p>
          <p id="bold">Featured</p>
        </div>
        <Gallery Images={RandomImages}/>
        <div id='line'></div>
        <div id='heading'>
          <p>Explore</p>
          <p id="bold">Most Favourited</p>
        </div>
        <Gallery Images={TopLikedImages}/>
        <div id='line'></div>
        <div id='heading'>
          <p>Explore</p>
          <p id="bold">Most Commented</p>
        </div>
        <Gallery Images={TopCommentedImages}/>
      </div>
    );
  }