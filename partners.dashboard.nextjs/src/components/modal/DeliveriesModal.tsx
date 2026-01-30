import {useAppStore} from "../../hooks/useAppStore";
import {DefaultTable} from "../table/DefaultTable";
export const DeliveriesModal = () => {
    const {modal} = useAppStore(state => state);

    return (
        <>
            <div className='w-full p-2'>
                <p>{modal.props.title}</p>
            </div>
            <DefaultTable />
        </>
    )
}