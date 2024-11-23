import './home.css'
import React from "react";
import Navbar from "../navbar";
import img1 from "./images/header-pic.svg"
const Home=()=>{
    return(
        <>
        <Navbar></Navbar>
        <div  id="main">

            <div id="left-inner">
                <div id='content'>
               <div id='header'>
                <span id='header-head'>Studying</span>Online is now much easier
               </div>
               <div id='para'>
                    Skilline is an interesting platform that will teach you in more an interactive way
               </div>
               </div>
            </div>
             
            <div id="right-inner">
                <img src={img1}></img>

            </div>
        </div>
        </>

    )
}

export default Home;
