import { Selection } from "d3-selection";

type IconResolver =  (parent: Selection<SVGGElement, unknown, Element | null, unknown>) => Selection<SVGGElement, unknown, Element | null, unknown>
type IconLibrary = Record<string, IconResolver>

const icons: IconLibrary = {}

const isIconNameInUse = (name: string): boolean => {
    return icons[name] !== undefined;
}

const registerIcon = (name: string, resolver: IconResolver) => {
    if(!isIconNameInUse(name)) {
        icons[name] = resolver;
    }
}

const registerIcons = (library: IconLibrary) => {
    Object.entries(library).forEach(([name, resolver]) => {
        if (!isIconNameInUse(name)) {
            icons[name] = resolver;
        }
    })
}

const getIcon = (name: string): IconResolver | null => {
    if (isIconNameInUse(name)) {
        return icons[name];
    }
    return null; // TODO: return default
}

export { registerIcon, registerIcons, getIcon, isIconNameInUse, IconLibrary }