import { useState } from "react";
import {useResizeObserver} from "../../hooks/useResizeObserver";


export const DefaultTable = (data:any[]) => {
    const {containerRef, useResizer} = useResizeObserver();

    return (
        <div ref={containerRef} className="flex flex-col w-full flex-1 px-4 py-3">
            {useResizer ? <TableView data={data} /> : <AccordionView data={data} />}
        </div>
    );
};

function TableView(data:any[]) {
    return (
        <div className="overflow-hidden rounded-lg border border-[#e6e6db] bg-white">
            <table className="w-full">
                <thead>
                <tr className="bg-white">
                    <th className="px-4 py-3 text-left text-[#181811] text-sm font-medium w-[400px]">Role Name</th>
                    <th className="px-4 py-3 text-left text-[#181811] text-sm font-medium w-[400px]">Permissions</th>
                    <th className="px-4 py-3 text-left text-[#181811] text-sm font-medium w-60">Actions</th>
                </tr>
                </thead>
                <tbody>
                {data?.map((r) => (
                    <tr key={r.name} className="border-t border-t-[#e6e6db]">
                        <td className="px-4 py-2 text-[#181811] text-sm">{r.name}</td>
                        <td className="px-4 py-2 text-[#8c8b5f] text-sm">{r.permissions}</td>
                        <td className="px-4 py-2 text-[#8c8b5f] text-sm font-bold tracking-[0.015em] cursor-pointer">
                            Delete
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function AccordionView(data:any[]) {
    return (
        <div className="space-y-3">
            {data.length && data?.map((r) => (
                <AccordionItem key={r.name} title={r.name} permissions={r.permissions} />
            ))}
        </div>
    );
}

function AccordionItem({title,
                           permissions,
                       }: {
    title: string;
    permissions: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-[#e6e6db] rounded-lg bg-white">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center px-4 py-3 text-left text-[#181811] text-sm font-medium"
            >
                {title}
                <span className="text-[#8c8b5f]">{open ? "–" : "+"}</span>
            </button>
            {open && (
                <div className="border-t border-[#e6e6db] px-4 py-3 text-sm text-[#8c8b5f]">
                    <p className="mb-2">
                        <strong>Permissions:</strong> {permissions}
                    </p>
                    <button className="font-bold text-[#8c8b5f] tracking-[0.015em]">
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
