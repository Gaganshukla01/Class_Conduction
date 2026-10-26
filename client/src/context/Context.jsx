import axios from "axios";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

const backend_url = import.meta.env.VITE_BACKEND_URI;

// Set once, at module load, so that EVERY request (including the first one
// made by any component) sends the auth cookie.
axios.defaults.withCredentials = true;

export const AppContent = createContext();

const errMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const AppContextProvider = (props) => {
  const [isLoggedIn, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(false);
  // `false` = "not loaded yet" (components show their loading state);
  // after a load they always hold a real value, even if the request failed.
  const [allUserData, setAllUserData] = useState(false);
  const [allCourse, setAllCourseData] = useState(false);
  const [allSchedule, setAllScheduleeData] = useState(false);
  // true only during the very first "am I logged in?" check
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sessionExpiredShown = useRef(false);
  const loggedInRef = useRef(false);
  useEffect(() => {
    loggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // ---------------------------------------------------------------- fetchers
  const getUserData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/user/data`);
      if (data.sucess) {
        setUserData(data.message);
        return data.message;
      }
      toast.error(data.message);
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(errMessage(error, "Error fetching user data"));
      }
    }
    return null;
  }, []);

  const getAllUserData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backend_url}/api/user/getalluser`);
      setAllUserData(data.success ? data : { success: false, data: [] });
    } catch (error) {
      setAllUserData({ success: false, data: [] });
      if (error?.response?.status !== 401) {
        toast.error(errMessage(error, "Error fetching users"));
      }
    }
  }, []);

  const getAllCourse = useCallback(async () => {
    try {
      const res = await axios.get(`${backend_url}/api/course/`);
      setAllCourseData(res.data || []);
    } catch (error) {
      setAllCourseData([]);
      toast.error(errMessage(error, "Error fetching courses"));
    }
  }, []);

  const getAllSchedule = useCallback(async () => {
    try {
      const res = await axios.get(
        `${backend_url}/api/classschedule/getallclasses`
      );
      setAllScheduleeData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      setAllScheduleeData((prev) => (prev === false ? [] : prev));
      if (error?.response?.status !== 401) {
        toast.error(errMessage(error, "Error fetching schedules"));
      }
    }
  }, []);

  // Loads everything the signed-in user needs. Safe to call any time.
  const loadAppData = useCallback(
    async (user) => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          getAllSchedule(),
          // Only admins may list every user (the endpoint is admin-only).
          user?.userType === "admin" ? getAllUserData() : Promise.resolve(),
        ]);
      } finally {
        setIsRefreshing(false);
      }
    },
    [getAllSchedule, getAllUserData]
  );

  // ------------------------------------------------------------ first load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Courses are public: the landing page needs them even before login.
      getAllCourse();
      try {
        const { data } = await axios.get(
          `${backend_url}/api/auth/isAuthenticate`
        );
        if (!cancelled && data.sucess) {
          setIsLoggedin(true);
          await getUserData();
        }
      } catch (error) {
        // 401 simply means "not logged in" - not an error worth showing
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAllCourse, getUserData]);

  // ------------------------------------------------------------ THE FIX
  // Previously data was only fetched on page load. After logging in (which
  // does not reload the page) the admin panel therefore had no data until the
  // browser was refreshed manually. Now the data loads whenever a user becomes
  // known - first visit, normal login, Google login or account switch.
  useEffect(() => {
    if (isLoggedIn && userData?.userId) {
      sessionExpiredShown.current = false;
      loadAppData(userData);
    }
  }, [isLoggedIn, userData?.userId, userData?.userType, loadAppData]);

  // Never show the previous user's data to the next person on this browser.
  useEffect(() => {
    if (!isLoggedIn) {
      setAllUserData(false);
      setAllScheduleeData(false);
    }
  }, [isLoggedIn]);

  // If the 7-day cookie expires mid-session, return to the login screen once.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error?.config?.url || "";
        if (
          error?.response?.status === 401 &&
          loggedInRef.current &&
          !url.includes("/api/auth/") &&
          !sessionExpiredShown.current
        ) {
          sessionExpiredShown.current = true;
          setIsLoggedin(false);
          setUserData(false);
          toast.info("Your session expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  // Silent re-fetch after a change (add class, mark attendance, ...). Unlike
  // the old version it does NOT flip the whole app back to a loading state.
  const refreshData = useCallback(async () => {
    if (!isLoggedIn) return;
    const user = (await getUserData()) || userData;
    await loadAppData(user);
  }, [isLoggedIn, userData, getUserData, loadAppData]);

  const value = useMemo(
    () => ({
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
      getAllSchedule,
      isDataLoading,
      isRefreshing,
      refreshData,
    }),
    [
      isLoggedIn,
      userData,
      allUserData,
      allCourse,
      allSchedule,
      isDataLoading,
      isRefreshing,
      getUserData,
      getAllUserData,
      getAllCourse,
      getAllSchedule,
      refreshData,
    ]
  );

  return (
    <AppContent.Provider value={value}>{props.children}</AppContent.Provider>
  );
};
