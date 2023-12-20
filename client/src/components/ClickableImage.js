import { Link } from 'react-router-dom';
import { FaStar, FaCommentAlt } from 'react-icons/fa';

export function ClickableImage(p) {
    return (
        <Link to={'../image/'+p.imagedata.imageid} id='image' style={{'backgroundImage':'url('+p.imagedata.url+')', 'backgroundSize':'cover'}}>
            <div className="imageoverlay">
                {p.imagedata.artistname ? (<>
                    <div id='left'>
                    <p id='title'>{p.imagedata.imagename}</p>
                    <div id='artist'>
                            <img src={p.imagedata.pfp} height='25' id='profilepic'></img>
                            <p>{p.imagedata.artistname}</p>
                    </div>
                    </div>
                    <div id='right'>
                        <p id='likes'>{p.imagedata.likes} <FaStar id='icon'/></p>
                        <p id='comments'>{p.imagedata.comments} <FaCommentAlt id='icon'/></p>
                    </div>
                </>) : null}

            </div>
        </Link>
    );
}