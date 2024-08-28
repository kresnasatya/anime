import { onNavigate } from "$app/navigation";
export const preparePageTransition = () => {
    // before completing the navigation, start a new transition
    onNavigate(navigation => {
        if (!document.startViewTransition) return;

        return new Promise(resolve => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            })
        })
    })
}