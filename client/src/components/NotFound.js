import { Link } from 'react-router-dom';

export function NotFound() {
  document.title = `DeviantArt | 404`
    return (
      <div id="NotFound"> 
        <h2>Error 404 - Page not found</h2>
        <Link to='..' className='hover'>Return to the Home Page</Link>
      </div>
    );
  }