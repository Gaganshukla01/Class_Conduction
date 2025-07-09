import React from 'react'
import Home from './pages/Home'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import './App.css'
import ResetPassword from './pages/ResetPassword'
import EmailVerify from './pages/EmailVerify'
import AdminDashboard from './pages/AdminPannel'
import StudentDashboard from './pages/StudentSection'
import CodeEditor from './pages/PlayGround'
import { ToastContainer } from 'react-toastify'

function App() {
  return (
    <>
      <ToastContainer />
    
     
      <div id="main-flow">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/resetPassword' element={<ResetPassword />} />
          <Route path='/emailVerify' element={<EmailVerify />} />
          <Route path='/admin' element={<AdminDashboard />} />
          <Route path='/studentdash' element={<StudentDashboard />} />
          <Route path='/playground' element={<CodeEditor />} />
        </Routes>
      </div>
    </>
  )
}

export default App