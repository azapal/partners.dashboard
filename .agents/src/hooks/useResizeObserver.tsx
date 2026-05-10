import {useEffect, useRef, useState} from "react";

export const useResizeObserver = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [parentWidth, setParentWidth] = useState<number>(0);
    const useResizer = parentWidth >= 768;


    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    setParentWidth(entry.contentRect.width);
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return {
        parentWidth,
        containerRef,
        useResizer,
    }
}