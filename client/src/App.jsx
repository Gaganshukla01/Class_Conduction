import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Navbar from './component/navbar'
import Login from './component/Auth/Login'


function App() {

  const router=createBrowserRouter([
    {
      path:"/",
      element:<Navbar/>
    },
    {
      path:"/login",
      element:<Login/>
    },

  ])


  return (
    <>
    <RouterProvider router={router}></RouterProvider>
    </>
  )
}

export default App
