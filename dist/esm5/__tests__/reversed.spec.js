/* tslint:disable:no-unsafe-any */
import * as fs from 'fs';
import akarata from '../index';
// describe('passing', () => {
//   test('hi there', () => {
//     expect(true).toBe(true)
//   })
// })
xdescribe('Reversed Lemas', function () {
    var reversedLemas = JSON.parse(fs.readFileSync(__dirname + "/reversed.json", 'utf8'));
    xdescribe('test again reversed lemas from KBBI dictionary', function () {
        var _loop_1 = function (i) {
            if (reversedLemas.hasOwnProperty(i)) {
                xit("'" + reversedLemas[i].kata + " should be stemmed to " + reversedLemas[i].lema + "'", function () {
                    ShouldStem(akarata.stem, reversedLemas[i].kata, reversedLemas[i].lema.trim());
                });
            }
        };
        for (var i in reversedLemas) {
            _loop_1(i);
        }
    });
});
function ShouldStem(methodName, word, transformWord) {
    var actual = methodName(word);
    // methodName(word).should.equal(transformWord)
    expect(actual).toEqual(transformWord);
}
//# sourceMappingURL=reversed.spec.js.map