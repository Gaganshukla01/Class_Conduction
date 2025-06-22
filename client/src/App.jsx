import React from 'react'
import Home from './pages/Home'
import { Route,Routes } from 'react-router-dom'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import EmailVerify from './pages/EmailVerify'
import { ToastContainer} from 'react-toastify';



function App() {
  return (
    <>
    <ToastContainer/>
    <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/resetPassword' element={<ResetPassword/>}/>
        <Route path='/emailVerify' element={<EmailVerify/>}/>
    </Routes>
  
  
    </>
  )
}

export default App
