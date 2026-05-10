export const DeliveriesTable = ({...props}) => {
    return (
        <>
            <header>
                {props.header}
            </header>
            <main>
                {props.children}
            </main>
            <footer>
                {props.footer}
            </footer>
        </>
    )
}