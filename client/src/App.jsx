import {useState } from 'react' 
import Navbar from './component/navbar'
import Login from './component/Auth/Login'
import Home from './component/Home/Home';
import Content from './component/Content/Content';
import Profile from './component/Profile/Profile';
import Class_comp from './component/Classes/Class';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

function App() {
  
  const router=createBrowserRouter([
    {
      path:"/",
      element:<Home/>
    },
    {
      path:"/login",
      element:<Login/>
    },
    {
      path:'/class',
      element:<Class_comp/>
    },
    {
      path:"/profile",
      element:<Profile/>
    },
    {
      path:"/content",

      element:<Content/>
    }

  ])

  return (
    <>
    <RouterProvider router={router}></RouterProvider>
    
    </>
  )
}

export default App
