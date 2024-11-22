import { useState } from 'react' 
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Navbar from './component/navbar'
import Login from './component/Auth/Login'
import Class_comp from './component/Classes/Class';

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
    {
      path:'/class',
      element:<Class_comp/>
    }

  ])

  return (
    <>
    <RouterProvider router={router}></RouterProvider>
    
    </>
  )
}

export default App
