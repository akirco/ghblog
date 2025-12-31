import { createMemoryRouter } from "react-router";
import App from "../App";
import About from "../pages/about";
import Home from "../pages/home";
import NotFound from "../pages/not-found";
import Settings from "../pages/settings";

export const router = createMemoryRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "settings", element: <Settings /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
