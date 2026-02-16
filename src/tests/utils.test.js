import { calcTileType } from "../js/utils";

test.each([[0, 8, 'top-left'], [1, 8, 'top'], [63, 8, 'bottom-right'], [7, 7, 'left'], [7, 8, 'top-right'],
           [56, 8, 'bottom-left'], [15, 8, 'right'], [26, 8, 'center'], [60, 8, 'bottom']])(
            'Проверяем функцию calcTileType (отображение границ)', (index, size, trueVal) => {
            expect(calcTileType(index, size)).toBe(trueVal);
})