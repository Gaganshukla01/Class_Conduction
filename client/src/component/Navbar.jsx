import React from "react";
import "./navbar.css"
import { Link } from "react-router-dom";

const Navbar=()=>{
    return(
    
    <>
       
       <nav>
        <ul>
            <div id="logo">Classes</div>
            <div id="items">
               <Link to="/"><li >Home</li></Link>
               <Link to="/class"><li>Class</li></Link>
               <Link to="/content"><li>Content</li></Link>
               <Link to="/profile"><li>Profile</li></Link>
               <Link to="/Login"><button id="btn">Login</button></Link>
                
            </div>
        </ul>
       </nav>
    
    </>

    )
}


export default Navbar;