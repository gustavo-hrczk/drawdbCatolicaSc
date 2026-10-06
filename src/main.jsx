import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import App from "./App.jsx";
import ExtensionsContext from "./context/ExtensionsContext";
import HomologBadge from "./catolica/HomologBadge.jsx";
import { catolicaExtensions } from "./catolica/extensions.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";
import "./catolica/i18n.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <ExtensionsContext.Provider value={catolicaExtensions}>
      <App />
    </ExtensionsContext.Provider>
    <HomologBadge />
  </LocaleProvider>,
);
