// tslint:disable:no-any
import IrregularWords from './irregular-words'
import StemmerUtility, { PositionType } from './stemmer-utility'

type Characters = string[]

const AMBIGUOUS_WORDS = [
  'nyanyi',
  'nyala',
  'nyata',
  'nasehat',
  'makan',
  'minum',
  'nikah',
]

enum Position {
  start = 'start',
  end = 'end',
}
export default class MorphologicalUtility {
  static VOWEL = ['a', 'e', 'i', 'o', 'u']
  static PARTICLE_CHARACTERS = ['kah', 'lah', 'pun']
  static POSSESSIVE_PRONOUN_CHARACTERS = ['ku', 'mu', 'nya']
  static FIRST_ORDER_PREFIX_CHARACTERS = [
    'meng',
    'meny',
    'men',
    'mem',
    'me',
    'peng',
    'peny',
    'pen',
    'pem',
    'di',
    'ter',
    'ke',
  ]
  static SPECIAL_FIRST_ORDER_PREFIX_CHARACTERS = [
    'meng',
    'peng',
    'meny',
    'peny',
    'pen',
    'men',
    'mem',
    'pem',
  ]
  static SECOND_ORDER_PREFIX_CHARACTERS = ['ber', 'be', 'per', 'pe']
  static SPECIAL_SECOND_ORDER_PREFIX_CHARACTERS = ['be']
  static NON_SPECIAL_SECOND_ORDER_PREFIX_CHARACTERS = ['ber', 'per', 'pe']
  static SPECIAL_SECOND_ORDER_PREFIX_WORDS = ['belajar', 'pelajar', 'belunjur']
  static SUFFIX_CHARACTERS = ['kan', 'an', 'i']
  static WITH_VOWEL_SUBSTITUTION_PREFIX_CHARACTERS = [
    'meny',
    'peny',
    'men',
    'pen',
  ]

  static REMOVED_KE = 1
  static REMOVED_PENG = 2
  static REMOVED_DI = 4
  static REMOVED_MENG = 8
  static REMOVED_TER = 16
  static REMOVED_BER = 32
  static REMOVED_PE = 64
  numberOfSyllables = 0
  _flags: any

  set flags(v: any) {
    this._flags = v
  }

  get flags() {
    return this._flags
  }

  totalSyllables = (word: string) => {
    let result = 0

    for (const value of word) {
      if (this.isVowel(value)) result++
    }

    return result
  }

  removeParticle = (word: string) => {
    this.numberOfSyllables = this.numberOfSyllables || this.totalSyllables(word)

    word = this.removeCharactersMatchingCollection(
      word,
      this.collectionFor('particle'),
      Position.end
    )

    return word
  }

  removePossessivePronoun = (word: string) => {
    this.numberOfSyllables = this.numberOfSyllables || this.totalSyllables(word)

    return this.removeCharactersMatchingCollection(
      word,
      this.collectionFor('possessive_pronoun'),
      Position.end
    )
  }

  removeFirstOrderPrefix = (word: string) => {
    this.numberOfSyllables = this.numberOfSyllables || this.totalSyllables(word)
    const prevWord = word
    word = this.removeAndSubstituteCharactersMatchingCollection(
      word,
      this.collectionFor('special_first_order_prefix'),
      Position.start
    )
    if (prevWord !== word) {
      return word
    }

    word = this.removeCharactersMatchingCollection(
      word,
      this.collectionFor('first_order_prefix'),
      Position.start
    )

    return word
  }

  removeSecondOrderPrefix = (word: string) => {
    this.numberOfSyllables = this.numberOfSyllables || this.totalSyllables(word)
    const wordLength = word.length
    if (MorphologicalUtility.SPECIAL_SECOND_ORDER_PREFIX_WORDS.includes(word)) {
      if (word.slice(0, 2) === 'be') {
        this.flags = this.flags || MorphologicalUtility.REMOVED_BER
      }
      this.reduceSyllable()
      word = this.sliceWordAtPosition(word, 3, Position.start)

      return word
    }

    if (
      StemmerUtility.isstartsWith(word, wordLength, 'be') &&
      wordLength > 4 &&
      !this.isVowel(word[2]) &&
      word.slice(3, 5) === 'er'
    ) {
      this.flags = this.flags || MorphologicalUtility.REMOVED_BER
      this.reduceSyllable()
      word = this.sliceWordAtPosition(word, 2, Position.start)

      return word
    }

    return this.removeCharactersMatchingCollection(
      word,
      this.collectionFor('non_special_second_order_prefix'),
      Position.start
    )
  }

  removeSuffix = (word: string) => {
    const {
      REMOVED_KE,
      REMOVED_PENG,
      REMOVED_PE,
      REMOVED_DI,
      REMOVED_MENG,
      REMOVED_TER,
      REMOVED_BER,
    } = MorphologicalUtility
    if (this.ambiguousWithSufficesEndingWords(word)) return word
    this.numberOfSyllables = this.numberOfSyllables || this.totalSyllables(word)
    let constantToCheck: number[] = []
    // tslint:disable-next-line:prefer-for-of
    for (
      let index = 0;
      index < MorphologicalUtility.SUFFIX_CHARACTERS.length;
      index++
    ) {
      const character = MorphologicalUtility.SUFFIX_CHARACTERS[index]
      switch (character) {
        case 'kan':
          constantToCheck = [REMOVED_KE, REMOVED_PENG, REMOVED_PE]
          break
        case 'an':
          constantToCheck = [REMOVED_DI, REMOVED_MENG, REMOVED_TER]
          break

        case 'i':
          constantToCheck = [REMOVED_BER, REMOVED_KE, REMOVED_PENG]
          break

        default:
          break
      }

      if (
        StemmerUtility.isendsWith(word, word.length, character) &&
        // tslint:disable-next-line:no-bitwise
        constantToCheck.every((cons) => (this.flags & cons) === 0)
      ) {
        this.reduceSyllable()
        word = this.sliceWordAtPosition(word, character.length, Position.end)
      }
    }

    return word
  }

  private ambiguousWithSufficesEndingWords(word: string) {
    return IrregularWords.ENDS_WITH_SUFFIX_CHARACTERS.includes(word)
  }

  private removeCharactersMatchingCollection(
    word: string,
    collection: Characters,
    position: string
  ) {
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < collection.length; index++) {
      const characters = collection[index]
      if (
        this.matchPositionAndNotAmbiguousWithCharacters(
          word,
          characters,
          position
        )
      ) {
        if (characters === 'mem' && this.isVowel(word[characters.length])) {
          continue
        }
        this.flags = this.flags || this.collectionFor(characters, 'removed')
        this.reduceSyllable()

        word = this.sliceWordAtPosition(word, characters.length, position)
      }
    }

    return word
  }

  private sliceWordAtPosition(
    word: string,
    characterSize: number,
    position: string
  ) {
    const multiplier = position === Position.start ? 0 : -1

    const wordSlice = word.split('')
    wordSlice.splice(multiplier * characterSize, characterSize)
    word = wordSlice.join('')

    return word
  }

  private removeAndSubstituteCharactersMatchingCollection(
    word: string,
    collection: Characters,
    position: string
  ) {
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < collection.length; index++) {
      const characters = collection[index]
      const matched = this.matchingCharactersRequiresSubstitution(
        word,
        characters,
        position
      )
      if (matched) {
        this.flags = this.flags || this.collectionFor(characters, 'removed')
        this.reduceSyllable()
        word = this.substituteWordCharacter(word, characters)
        word = this.sliceWordAtPosition(
          word,
          characters.length - 1,
          Position.start
        )
      }
    }

    return word
  }

  private matchingCharactersRequiresSubstitution(
    word: string,
    characters: string,
    position: string
  ) {
    return (
      this.matchCharactersPositionFollowedByVowel(word, characters, position) &&
      this.substitutionRequired(word, characters)
    )
  }

  private matchCharactersPositionFollowedByVowel(
    word: string,
    characters: string,
    position: string
  ) {
    const wordLength = word.length
    const characterSize = characters.length
    const Pos = `is${position}sWith`

    return (
      StemmerUtility[Pos as keyof PositionType](word, wordLength, characters) &&
      wordLength > characterSize &&
      this.isVowel(word[characterSize])
    )
  }

  private substitutionRequired(word: string, characters: string) {
    return (
      MorphologicalUtility.WITH_VOWEL_SUBSTITUTION_PREFIX_CHARACTERS.includes(
        characters
      ) || this.containsIrregularPrefix(word, characters)
    )
  }

  private containsIrregularPrefix(word: string, characters: string) {
    const irregularOnPrefix = Object.keys(
      IrregularWords.ON_PREFIX_CHARACTERS
    ).includes(characters)
    if (irregularOnPrefix) {
      return this.choppedWordMatchWordsCollection(
        word.slice(characters.length, word.length),
        (IrregularWords.ON_PREFIX_CHARACTERS as any)[characters]
      )
    }

    return false
  }

  private substituteWordCharacter(word: string, characters: string) {
    let substituteChar = ''
    switch (true) {
      case ['meny', 'peny'].includes(characters):
        substituteChar = 's'
        break
      case ['men', 'pen'].includes(characters):
        substituteChar = this.choppedWordMatchWordsCollection(
          word.slice(characters.length, word.length),
          (IrregularWords as any).BEGINS_WITH_N
        )
          ? 'n'
          : 't'
        break
      case ['meng', 'peng'].includes(characters):
        substituteChar = 'k'
        break
      case ['mem', 'pem'].includes(characters):
        substituteChar = 'p'
        break

      default:
        break
    }
    const reduceChars = characters.length - 1
    const firstChar = word.slice(-word.length, reduceChars)
    const oldSubstituteChar = word[reduceChars]
    const resChar = word.slice(characters.length)

    return substituteChar ? firstChar + substituteChar + resChar : word
  }

  private isVowel(character: string) {
    return MorphologicalUtility.VOWEL.includes(character)
  }

  private collectionFor(name: string, type = 'characters') {
    let constantName
    const col1 = ['meny', 'men', 'mem', 'me']
    const col2 = ['peny', 'pen', 'pe']
    if (type === 'characters') {
      constantName = `${name}_${type}`
    } else {
      switch (true) {
        case col1.includes(name):
          name = 'meng'
          break
        case col2.includes(name):
          name = 'peng'
          break

        default:
          break
      }
      constantName = `${type}_${name}`
    }
    const staticMethod = constantName.toUpperCase()

    const collection: Characters = (MorphologicalUtility as any)[staticMethod]

    return collection
  }

  private matchPositionAndNotAmbiguousWithCharacters(
    word: string,
    characters: string,
    position: string
  ) {
    const pos = `is${position}sWith`

    return (
      StemmerUtility[pos as keyof PositionType](
        word,
        word.length,
        characters
      ) && !this.ambiguousWithCharacters(word, characters, position)
    )
  }

  private ambiguousWithCharacters(
    word: string,
    characters: string,
    position: string
  ) {
    if (position === Position.start) {
      if (characters === 'per') {
        return this.choppedWordMatchWordsCollection(
          word.slice(3, word.length),
          (IrregularWords as any).BEGINS_WITH_R
        )
      } else {
        return false
      }
    } else {
      return (IrregularWords.ENDS_WITH_COMMON_CHARACTERS as any)[
        characters
      ].some((ambiguousWord: string) => {
        const prefix = ['me', 'be', 'pe']
        if (!prefix.includes(word.slice(0, 2))) {
          return false
        }

        return StemmerUtility.isendsWith(word, word.length, ambiguousWord)
      })
    }
  }

  private choppedWordMatchWordsCollection(
    choppedWord: string,
    collection: Characters
  ) {
    return collection.some((word) =>
      StemmerUtility.isstartsWith(choppedWord, choppedWord.length, word)
    )
  }

  private reduceSyllable() {
    this.numberOfSyllables -= -1
  }
}
