import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
const backend_url = import.meta.env.VITE_BACKEND_URI;
export const AppContent = createContext();

export const AppContextProvider = (props) => {
  const [isLoggedIn, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(false);
  const [allUserData, setAllUserData] = useState(false);
  const [allCourse, setAllCourseData] = useState(false);
  const [allSchedule, setAllScheduleeData] = useState(false);

  const getAuthState = async () => {
    axios.defaults.withCredentials = true;
    try {
      const { data } = await axios.get(
        `${backend_url}/api/auth/isAuthenticate`
      );
      if (data.sucess) {
        setIsLoggedin(true);
        getUserData();
        getAllUserData();
        getAllCourse();
        getAllSchedule();
      }
    } catch (error) {
      console.log(error.response?.data?.message || "An error occurred");
    }
  };

  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/user/data`);
      data.sucess ? setUserData(data.message) : toast.error(data.message);
    } catch (error) {
      toast.error(data.message);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const getAllUserData = async () => {
    axios.defaults.withCredentials = true;
    try {
      const { data } = await axios.get(`${backend_url}/api/user/getalluser`);
      data.success ? setAllUserData(data) : toast.error(data.message);
    } catch (error) {
      toast.error(data.message);
    }
  };
  const getAllCourse = async () => {
    axios.defaults.withCredentials = true;
    try {
      const res = await axios.get(`${backend_url}/api/course/`);
      res.data ? setAllCourseData(res.data) : toast.error(res.message);
    } catch (error) {
      toast.error(data.message);
    }
  };

  const getAllSchedule = async () => {
    axios.defaults.withCredentials = true;
    try {
      const res = await axios.get(`${backend_url}/api/classschedule/getallclasses`);
      res.data ? setAllScheduleeData(res.data.data) : toast.error(res.message);
    } catch (error) {
      toast.error(data.message);
    }
  };

  const value = {
    backend_url,
    isLoggedIn,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
    getAllUserData,
    allUserData,
    getAllCourse,
    allCourse,
    allSchedule,
    getAllSchedule
  };

  return (
    <AppContent.Provider value={value}>{props.children}</AppContent.Provider>
  );
};
