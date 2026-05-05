import {useCallback, useEffect, useState} from "react";
import {useAppStore} from "../../hooks/useAppStore";
import {sheetActions} from "../../store/client/sheets";
import {sheetConstant} from "../../constant/sheetConstant";

type CloseSheetOptions = {
    confirmClose?: boolean;
};

export function DefaultResizableSheet(){
    const [width, setWidth] = useState<number>(400);
    const {modal, modal:{show, name}} =useAppStore(state => state);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    // Detect screen size and update layout
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setWidth(mobile ? window.innerWidth : 400);
        };

        handleResize(); // initialize on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleResize = (e: React.MouseEvent) => {
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

    const closeSheet = useCallback((options: CloseSheetOptions = {}) => {
        const request = {
            ...modal,
            name: null,
            show: false,
            props: null,
        }
        if (!options.confirmClose) {
            sheetActions.toggleBasicResizableSheet(request);
        } else {
            // Use native confirm or implement a proper modal
            if (window.confirm('Are you sure you want to close?')) {
                sheetActions.toggleBasicResizableSheet(request);
            }
        }
    }, [modal]);

    const Component = sheetConstant[name || ""];

    // Optional: close with ESC key
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && show) {
                closeSheet();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [show, closeSheet]);

    if (!show) {
        return null;
    }

    return (
        <>
            {/* Backdrop overlay */}
            <div 
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => closeSheet()}
                aria-hidden="true"
            />
            
            {/* Sheet */}
            <div 
                style={{
                    width: isMobile ? "100vw" : width,
                    height: isMobile ? "100vh" : "100%",
                    minWidth: isMobile ? undefined : 364,
                    transition: "width 0.25s ease, height 0.25s ease",
                }}
                className="fixed top-0 right-0 z-50 flex flex-col bg-white shadow-lg"
                role="dialog"
                aria-modal="true"
                aria-labelledby="sheet-title"
            >
                <div className='w-full h-fit flex justify-end p-4'>
                    <button
                        onClick={() => closeSheet()}
                        className='bg-white cursor-pointer shadow-md p-2 border rounded-full h-8 w-8 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-gray-50 transition-colors'
                        aria-label="Close"
                    >
                        <i className="ri-close-line text-lg"></i>
                    </button>
                </div>
                
                {!isMobile && (
                    <div 
                        onMouseDown={handleResize} 
                        className="h-full w-1 bg-gray-300 hover:bg-[#0000004d] cursor-ew-resize absolute top-0 left-0 transition-colors"
                        title="Resize handle"
                    />
                )}
                
                <div className="flex-1 overflow-y-auto">
                    {Component && <Component />}
                </div>
            </div>
        </>
    );
}
