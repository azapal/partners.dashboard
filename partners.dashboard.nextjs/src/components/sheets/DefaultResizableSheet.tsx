import {useState} from "react";
import {useAppStore} from "../../hooks/useAppStore";
import {sheetActions} from "../../store/client/sheets";
import {sheetConstant} from "../../constant/sheetConstant";

export function DefaultResizableSheet(){
    const [width, setWidth] = useState<number>(400);
    const {modal, modal:{show, name}} =useAppStore(state => state);


    const handleResize = (e:any) => {
        const startX = e.clientX;
        const startWidth = width;
        const onMove = (moveEvent: MouseEvent) =>
            setWidth(Math.max(64, startWidth + (startX - moveEvent.clientX)));
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    function closeSheet({...props}){
        const request = {
            ...modal,
            name: null,
            show:!show,
            props:null,
        }
        if(!props.confirmClose){
            sheetActions.toggleBasicResizableSheet(request);
        }else{
            alert('Are you sure you want to close?');
        }
    }

    const Component = sheetConstant[name || ""];


    return (
        <div style={show ? {width: width, minWidth:364} : {width: 0}} className={`flex flex-col transition-all items-center  relative`}>
            {show && (
                <>
                    <div className='w-full h-fit flex justify-end'>
                        <div onClick={closeSheet} className='bg-white top-2 right-2 absolute cursor-pointer shadow p-2 border rounded-full h-6 w-6 flex items-center justify-center text-red-500'>
                            X
                        </div>
                    </div>
                    <div onMouseDownCapture={(e) => handleResize(e)} className="h-8 w-1 z-50 bg-black cursor-ew-resize border absolute bottom-[500px] left-2" />
                    <Component  />
                </>
            )}


        </div>

    )
}
