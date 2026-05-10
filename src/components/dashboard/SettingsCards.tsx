import { Link } from "react-router-dom";
import { sheetActions } from "../../store/client/sheets";
interface SettingsCardsProps {
  children: {
    title: string;
    description?: string;
    icon?: string;
    path?: any;
  }[];
  header?: string;
}
export const SettingsCards = ({ ...props }: SettingsCardsProps) => {
  function handleClick(item:string){
    if(item?.toLowerCase() === 'logout') location.href = '/LogoutScreen' //logout
    else if(item?.toLowerCase() === 'account information') handleToggle(item, 'accountView')
    else if(item?.toLowerCase() === 'business information') handleToggle(item, 'businessInfo')
    else if(item?.toLowerCase() === 'notification preferences') handleToggle(item, 'notificationPreference')
    else if(item?.toLowerCase() === 'user management') handleToggle(item, 'userManagement')
  }

  function handleToggle(value?:string, modalName?:string){
    const openModal = {
      name:modalName,
      show:true,
      props: {
        title:value
      }
    }
    sheetActions.toggleBasicResizableSheet(openModal)
  }


  return (
    <div className="w-full">
      <p className="font-bold py-3 px-1">{props.header}</p>

      {props.children.map((item, index) => (


          <div key={index}  onClick={() => handleClick(item.title)}   className='flex items-start py-3 px-1 hover:bg-gray-100  hover:rounded-[8px] cursor-pointer justify-start gap-[11px]'>
            <img src={item.icon} alt={`${item}-settings`} />
            <div>
          <p className="font-medium text-sm">{item.title}</p>
          <p className="font-thin text-xs">{item.description}</p>
        </div>
          </div>


      ))}
    </div>
  );
};
