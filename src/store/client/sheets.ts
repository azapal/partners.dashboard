import { Store } from '@tanstack/store';

type SheetsState = {
    modal: {
        show: boolean;
        name: string|null|undefined;
        props?:any
        callback?: () => void
    }
}

export const sheetStore = new Store<SheetsState>({
    modal:{
        show: false,
        name:null,
        props:{},
        callback:()=> {}
    }

})

// Optional actions to mutate state
export const sheetActions = {
    // set sheet visibility
    toggleBasicResizableSheet: (modal: SheetsState['modal']) => {
        sheetStore.setState((state) => ({
            ...state, modal
        }))
        console.log(modal)
    },

}

// Optional logics functions to perform task
export const authLogics = {
    //triggers api

}

