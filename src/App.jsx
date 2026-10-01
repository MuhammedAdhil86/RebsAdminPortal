import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { router } from "../src/routes/routes.jsx";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss={false}
        limit={4}
        theme="colored"
        style={{ zIndex: 99999 }}
      />
    </>
  );
}
