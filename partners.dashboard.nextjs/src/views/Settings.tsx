import {DashboardLayout} from "../layouts/DashboardLayout";
import {SettingsCards} from "../components/dashboard/SettingsCards";
export const Settings = () => {
    return (
        <DashboardLayout>
            <main className="w-full flex flex-col overflow-y-scroll ">
                <div className='flex-1'>
                    {settingsActions.map((action, index) => (
                        <SettingsCards key={index} {...action} />
                    ))}
                </div>


            </main>


        </DashboardLayout>
    )
}

const settingsActions = [
    {header:'Account',
        children:[
            {
                title: "Account information",
                description:'Manage your account details',
                icon:'/icons/person.svg'
            },
            {
                title: "Business information",
                description:'Manage your business information',
                icon:'/icons/suitcase.svg'
            },
            {
                title: "Payment methods",
                description:'Manage your payment methods',
                icon:'/icons/card.svg'
            }]
    },

    {header:'Notifications',
        children:[
            {
                title: "Notification preferences",
                description:'Manage your notification preferences',
                icon:'/icons/bell.svg'
            }]
    },
    {header:'Security',
        children:[
            {
                title: "Change password",
                description:'Manage your password',
                icon:'/icons/lock2.svg'
            },
            {
                title: "Two-factor authentication",
                description:'Manage your two-factor authentication',
                icon:'/icons/shield.svg'
            }]
    },
    {header:'Support',
        children:[
            {
                title: "Help center",
                description:'Get help with your account',
                icon:'/icons/faq.svg'
            },
            {
                title: "Contact support",
                description:'Contact support',
                icon:'/icons/customer_care.svg'
            }]
    },
    {header:'Logout',
        children:[
            {
                title: "Logout",
                icon:'/icons/logout.svg'
            }]
    }
]


