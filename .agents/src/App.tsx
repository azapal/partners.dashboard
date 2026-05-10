
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {useAppStore} from "./hooks/useAppStore";
import {sheetActions} from "./store/client/sheets";
import {DefaultResizableSheet} from "./components/sheets/DefaultResizableSheet";
import { AppRoutes } from "./Routes.js";

function App() {
  const {modal:{show}} =useAppStore(state => state);


  return (
    <BrowserRouter>
      <div className='flex'>
        <div className='flex-1 relative'>
          {show && (<div  className='bg-black/60 w-full h-screen z-50 absolute'></div>)}
          <AppRoutes/>
        </div>
        <DefaultResizableSheet />
      </div>
      </BrowserRouter>
  );
}



export default App;
