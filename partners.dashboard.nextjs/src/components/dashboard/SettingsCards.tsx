import {sheetActions} from "../../store/client/sheets";
interface SettingsCardsProps {
    children:{
        title: string,
        description?: string,
        icon?: string
    }[];
    header?: string;
}
export const SettingsCards = ({...props}:SettingsCardsProps) => {

    function handleClick(){
        sheetActions.toggleBasicResizableSheet(true)
    }
    return (
        <div className='w-fit'>
            <p className='font-bold py-3 px-1'>{props.header}</p>
            {props.children.map((item, index) => (
                <div onClick={handleClick} key={index} className='flex items-start py-3 px-1 hover:bg-[#FD11F3]/10  hover:rounded-[8px] cursor-pointer justify-start gap-[11px]'>
                    <img src={item.icon}  alt={`${item}-settings`} />
                    <div>
                        <p className='font-medium text-sm'>{item.title}</p>
                        <p className='font-thin text-xs'>{item.description}</p>
                    </div>
                </div>
            ))}

        </div>
    )
}