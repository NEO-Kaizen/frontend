/**
 * Icon sizes:
 * - `sm`: 16px
 * - `md`: 20px
 * - `lg`: 24px
 */
export type IconSize = 'sm' | 'md' | 'lg';


//Mais fácil manter aqui por hora, mas se tivermos separações de outras coisas similares, movemos
export const iconDictionary = {
    centralQueue: 'featured_play_list',
    history: 'history',
    home: 'home',
    manageUsers: 'user_attributes',
    search: 'search',
    logout: 'logout'
}

export type IconName = keyof typeof iconDictionary