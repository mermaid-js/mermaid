// Generated from java-escape by ANTLR 4.11.1
// jshint ignore: start
import antlr4 from 'antlr4';
import sequenceParserListener from './sequenceParserListener.js';
const serializedATN = [
  4, 1, 65, 550, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6,
  2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14,
  7, 14, 2, 15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21,
  7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2, 24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2, 27, 7, 27, 2, 28,
  7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2, 32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35,
  7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38, 2, 39, 7, 39, 2, 40, 7, 40, 2, 41, 7, 41, 2, 42,
  7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47, 7, 47, 2, 48, 7, 48, 2, 49,
  7, 49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 1, 0, 3, 0, 108, 8, 0, 1, 0, 1, 0, 3, 0, 112, 8,
  0, 1, 0, 1, 0, 1, 0, 1, 0, 3, 0, 118, 8, 0, 1, 0, 3, 0, 121, 8, 0, 1, 0, 1, 0, 1, 0, 3, 0, 126, 8,
  0, 1, 1, 1, 1, 1, 1, 3, 1, 131, 8, 1, 1, 2, 1, 2, 4, 2, 135, 8, 2, 11, 2, 12, 2, 136, 1, 2, 1, 2,
  5, 2, 141, 8, 2, 10, 2, 12, 2, 144, 9, 2, 1, 2, 3, 2, 147, 8, 2, 1, 3, 1, 3, 3, 3, 151, 8, 3, 1,
  3, 1, 3, 5, 3, 155, 8, 3, 10, 3, 12, 3, 158, 9, 3, 1, 3, 1, 3, 1, 3, 3, 3, 163, 8, 3, 1, 3, 1, 3,
  1, 3, 3, 3, 168, 8, 3, 3, 3, 170, 8, 3, 1, 4, 1, 4, 1, 4, 3, 4, 175, 8, 4, 1, 4, 3, 4, 178, 8, 4,
  1, 4, 3, 4, 181, 8, 4, 1, 5, 1, 5, 1, 6, 3, 6, 186, 8, 6, 1, 6, 3, 6, 189, 8, 6, 1, 6, 1, 6, 3, 6,
  193, 8, 6, 1, 6, 3, 6, 196, 8, 6, 1, 6, 3, 6, 199, 8, 6, 1, 6, 1, 6, 3, 6, 203, 8, 6, 1, 7, 1, 7,
  1, 7, 1, 7, 1, 7, 1, 7, 1, 7, 3, 7, 212, 8, 7, 1, 7, 1, 7, 3, 7, 216, 8, 7, 3, 7, 218, 8, 7, 1, 8,
  1, 8, 1, 8, 3, 8, 223, 8, 8, 1, 9, 1, 9, 1, 10, 1, 10, 1, 11, 1, 11, 1, 12, 4, 12, 232, 8, 12, 11,
  12, 12, 12, 233, 1, 13, 1, 13, 3, 13, 238, 8, 13, 1, 13, 3, 13, 241, 8, 13, 1, 13, 1, 13, 1, 13,
  3, 13, 246, 8, 13, 3, 13, 248, 8, 13, 1, 14, 1, 14, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16, 1, 16, 1,
  16, 1, 16, 1, 16, 1, 16, 3, 16, 262, 8, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3, 16, 269, 8, 16,
  1, 17, 1, 17, 1, 17, 3, 17, 274, 8, 17, 1, 18, 1, 18, 1, 18, 3, 18, 279, 8, 18, 1, 19, 1, 19, 1,
  19, 3, 19, 284, 8, 19, 1, 20, 3, 20, 287, 8, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 293, 8, 20, 1,
  20, 3, 20, 296, 8, 20, 1, 20, 3, 20, 299, 8, 20, 1, 20, 3, 20, 302, 8, 20, 1, 21, 1, 21, 1, 21, 3,
  21, 307, 8, 21, 1, 22, 3, 22, 310, 8, 22, 1, 22, 1, 22, 1, 22, 3, 22, 315, 8, 22, 1, 22, 1, 22, 1,
  22, 3, 22, 320, 8, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 3, 22, 327, 8, 22, 1, 22, 1, 22, 1, 22,
  3, 22, 332, 8, 22, 1, 23, 1, 23, 1, 23, 5, 23, 337, 8, 23, 10, 23, 12, 23, 340, 9, 23, 1, 24, 1,
  24, 1, 25, 1, 25, 1, 26, 1, 26, 3, 26, 348, 8, 26, 1, 27, 1, 27, 3, 27, 352, 8, 27, 1, 27, 1, 27,
  1, 28, 3, 28, 357, 8, 28, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 1, 29, 3, 29, 365, 8, 29, 1, 29, 1,
  29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 3, 29, 374, 8, 29, 3, 29, 376, 8, 29, 1, 30, 1, 30, 1, 31,
  1, 31, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 33, 5, 33, 388, 8, 33, 10, 33, 12, 33, 391, 9, 33, 1,
  33, 3, 33, 394, 8, 33, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35, 5, 35, 401, 8, 35, 10, 35, 12, 35, 404,
  9, 35, 1, 35, 3, 35, 407, 8, 35, 1, 36, 1, 36, 3, 36, 411, 8, 36, 1, 37, 1, 37, 1, 37, 1, 38, 1,
  38, 5, 38, 418, 8, 38, 10, 38, 12, 38, 421, 9, 38, 1, 38, 3, 38, 424, 8, 38, 1, 39, 1, 39, 1, 39,
  1, 40, 1, 40, 3, 40, 431, 8, 40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 1, 42, 1, 42, 5, 42, 440, 8,
  42, 10, 42, 12, 42, 443, 9, 42, 1, 42, 3, 42, 446, 8, 42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 44, 1,
  44, 1, 44, 1, 44, 1, 44, 1, 45, 1, 45, 1, 45, 1, 46, 1, 46, 3, 46, 462, 8, 46, 1, 46, 1, 46, 1,
  47, 1, 47, 1, 47, 1, 47, 1, 47, 1, 47, 1, 47, 3, 47, 473, 8, 47, 1, 48, 1, 48, 1, 48, 1, 48, 1,
  48, 1, 48, 1, 48, 1, 48, 1, 48, 3, 48, 484, 8, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1,
  48, 1, 48, 1, 48, 3, 48, 495, 8, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1,
  48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 5, 48,
  518, 8, 48, 10, 48, 12, 48, 521, 9, 48, 1, 49, 1, 49, 1, 49, 1, 49, 1, 49, 3, 49, 528, 8, 49, 1,
  50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 1, 50, 3, 50, 539, 8, 50, 1, 51, 1, 51, 1,
  51, 3, 51, 544, 8, 51, 1, 52, 1, 52, 1, 52, 1, 52, 1, 52, 0, 1, 96, 53, 0, 2, 4, 6, 8, 10, 12, 14,
  16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62,
  64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 0, 10, 2,
  0, 54, 54, 57, 57, 2, 0, 8, 8, 17, 17, 2, 0, 9, 9, 16, 16, 2, 0, 10, 10, 21, 21, 1, 0, 22, 24, 1,
  0, 20, 21, 1, 0, 16, 19, 1, 0, 14, 15, 1, 0, 55, 56, 1, 0, 34, 35, 606, 0, 125, 1, 0, 0, 0, 2,
  127, 1, 0, 0, 0, 4, 146, 1, 0, 0, 0, 6, 169, 1, 0, 0, 0, 8, 180, 1, 0, 0, 0, 10, 182, 1, 0, 0, 0,
  12, 202, 1, 0, 0, 0, 14, 217, 1, 0, 0, 0, 16, 222, 1, 0, 0, 0, 18, 224, 1, 0, 0, 0, 20, 226, 1, 0,
  0, 0, 22, 228, 1, 0, 0, 0, 24, 231, 1, 0, 0, 0, 26, 247, 1, 0, 0, 0, 28, 249, 1, 0, 0, 0, 30, 251,
  1, 0, 0, 0, 32, 268, 1, 0, 0, 0, 34, 273, 1, 0, 0, 0, 36, 278, 1, 0, 0, 0, 38, 280, 1, 0, 0, 0,
  40, 301, 1, 0, 0, 0, 42, 303, 1, 0, 0, 0, 44, 331, 1, 0, 0, 0, 46, 333, 1, 0, 0, 0, 48, 341, 1, 0,
  0, 0, 50, 343, 1, 0, 0, 0, 52, 345, 1, 0, 0, 0, 54, 349, 1, 0, 0, 0, 56, 356, 1, 0, 0, 0, 58, 375,
  1, 0, 0, 0, 60, 377, 1, 0, 0, 0, 62, 379, 1, 0, 0, 0, 64, 381, 1, 0, 0, 0, 66, 393, 1, 0, 0, 0,
  68, 395, 1, 0, 0, 0, 70, 397, 1, 0, 0, 0, 72, 410, 1, 0, 0, 0, 74, 412, 1, 0, 0, 0, 76, 415, 1, 0,
  0, 0, 78, 425, 1, 0, 0, 0, 80, 428, 1, 0, 0, 0, 82, 434, 1, 0, 0, 0, 84, 437, 1, 0, 0, 0, 86, 447,
  1, 0, 0, 0, 88, 451, 1, 0, 0, 0, 90, 456, 1, 0, 0, 0, 92, 459, 1, 0, 0, 0, 94, 472, 1, 0, 0, 0,
  96, 494, 1, 0, 0, 0, 98, 527, 1, 0, 0, 0, 100, 538, 1, 0, 0, 0, 102, 543, 1, 0, 0, 0, 104, 545, 1,
  0, 0, 0, 106, 108, 3, 2, 1, 0, 107, 106, 1, 0, 0, 0, 107, 108, 1, 0, 0, 0, 108, 109, 1, 0, 0, 0,
  109, 126, 5, 0, 0, 1, 110, 112, 3, 2, 1, 0, 111, 110, 1, 0, 0, 0, 111, 112, 1, 0, 0, 0, 112, 113,
  1, 0, 0, 0, 113, 114, 3, 4, 2, 0, 114, 115, 5, 0, 0, 1, 115, 126, 1, 0, 0, 0, 116, 118, 3, 2, 1,
  0, 117, 116, 1, 0, 0, 0, 117, 118, 1, 0, 0, 0, 118, 120, 1, 0, 0, 0, 119, 121, 3, 4, 2, 0, 120,
  119, 1, 0, 0, 0, 120, 121, 1, 0, 0, 0, 121, 122, 1, 0, 0, 0, 122, 123, 3, 24, 12, 0, 123, 124, 5,
  0, 0, 1, 124, 126, 1, 0, 0, 0, 125, 107, 1, 0, 0, 0, 125, 111, 1, 0, 0, 0, 125, 117, 1, 0, 0, 0,
  126, 1, 1, 0, 0, 0, 127, 128, 5, 6, 0, 0, 128, 130, 5, 64, 0, 0, 129, 131, 5, 65, 0, 0, 130, 129,
  1, 0, 0, 0, 130, 131, 1, 0, 0, 0, 131, 3, 1, 0, 0, 0, 132, 135, 3, 6, 3, 0, 133, 135, 3, 12, 6, 0,
  134, 132, 1, 0, 0, 0, 134, 133, 1, 0, 0, 0, 135, 136, 1, 0, 0, 0, 136, 134, 1, 0, 0, 0, 136, 137,
  1, 0, 0, 0, 137, 147, 1, 0, 0, 0, 138, 141, 3, 6, 3, 0, 139, 141, 3, 12, 6, 0, 140, 138, 1, 0, 0,
  0, 140, 139, 1, 0, 0, 0, 141, 144, 1, 0, 0, 0, 142, 140, 1, 0, 0, 0, 142, 143, 1, 0, 0, 0, 143,
  145, 1, 0, 0, 0, 144, 142, 1, 0, 0, 0, 145, 147, 3, 8, 4, 0, 146, 134, 1, 0, 0, 0, 146, 142, 1, 0,
  0, 0, 147, 5, 1, 0, 0, 0, 148, 150, 5, 43, 0, 0, 149, 151, 3, 20, 10, 0, 150, 149, 1, 0, 0, 0,
  150, 151, 1, 0, 0, 0, 151, 152, 1, 0, 0, 0, 152, 156, 5, 32, 0, 0, 153, 155, 3, 12, 6, 0, 154,
  153, 1, 0, 0, 0, 155, 158, 1, 0, 0, 0, 156, 154, 1, 0, 0, 0, 156, 157, 1, 0, 0, 0, 157, 159, 1, 0,
  0, 0, 158, 156, 1, 0, 0, 0, 159, 170, 5, 33, 0, 0, 160, 162, 5, 43, 0, 0, 161, 163, 3, 20, 10, 0,
  162, 161, 1, 0, 0, 0, 162, 163, 1, 0, 0, 0, 163, 164, 1, 0, 0, 0, 164, 170, 5, 32, 0, 0, 165, 167,
  5, 43, 0, 0, 166, 168, 3, 20, 10, 0, 167, 166, 1, 0, 0, 0, 167, 168, 1, 0, 0, 0, 168, 170, 1, 0,
  0, 0, 169, 148, 1, 0, 0, 0, 169, 160, 1, 0, 0, 0, 169, 165, 1, 0, 0, 0, 170, 7, 1, 0, 0, 0, 171,
  177, 5, 50, 0, 0, 172, 174, 5, 30, 0, 0, 173, 175, 3, 10, 5, 0, 174, 173, 1, 0, 0, 0, 174, 175, 1,
  0, 0, 0, 175, 176, 1, 0, 0, 0, 176, 178, 5, 31, 0, 0, 177, 172, 1, 0, 0, 0, 177, 178, 1, 0, 0, 0,
  178, 181, 1, 0, 0, 0, 179, 181, 5, 52, 0, 0, 180, 171, 1, 0, 0, 0, 180, 179, 1, 0, 0, 0, 181, 9,
  1, 0, 0, 0, 182, 183, 7, 0, 0, 0, 183, 11, 1, 0, 0, 0, 184, 186, 3, 18, 9, 0, 185, 184, 1, 0, 0,
  0, 185, 186, 1, 0, 0, 0, 186, 188, 1, 0, 0, 0, 187, 189, 3, 14, 7, 0, 188, 187, 1, 0, 0, 0, 188,
  189, 1, 0, 0, 0, 189, 190, 1, 0, 0, 0, 190, 192, 3, 20, 10, 0, 191, 193, 3, 22, 11, 0, 192, 191,
  1, 0, 0, 0, 192, 193, 1, 0, 0, 0, 193, 195, 1, 0, 0, 0, 194, 196, 3, 16, 8, 0, 195, 194, 1, 0, 0,
  0, 195, 196, 1, 0, 0, 0, 196, 198, 1, 0, 0, 0, 197, 199, 5, 11, 0, 0, 198, 197, 1, 0, 0, 0, 198,
  199, 1, 0, 0, 0, 199, 203, 1, 0, 0, 0, 200, 203, 3, 14, 7, 0, 201, 203, 3, 18, 9, 0, 202, 185, 1,
  0, 0, 0, 202, 200, 1, 0, 0, 0, 202, 201, 1, 0, 0, 0, 203, 13, 1, 0, 0, 0, 204, 205, 5, 8, 0, 0,
  205, 206, 3, 20, 10, 0, 206, 207, 5, 9, 0, 0, 207, 218, 1, 0, 0, 0, 208, 209, 5, 8, 0, 0, 209,
  211, 3, 20, 10, 0, 210, 212, 5, 16, 0, 0, 211, 210, 1, 0, 0, 0, 211, 212, 1, 0, 0, 0, 212, 218, 1,
  0, 0, 0, 213, 215, 7, 1, 0, 0, 214, 216, 7, 2, 0, 0, 215, 214, 1, 0, 0, 0, 215, 216, 1, 0, 0, 0,
  216, 218, 1, 0, 0, 0, 217, 204, 1, 0, 0, 0, 217, 208, 1, 0, 0, 0, 217, 213, 1, 0, 0, 0, 218, 15,
  1, 0, 0, 0, 219, 220, 5, 45, 0, 0, 220, 223, 3, 20, 10, 0, 221, 223, 5, 45, 0, 0, 222, 219, 1, 0,
  0, 0, 222, 221, 1, 0, 0, 0, 223, 17, 1, 0, 0, 0, 224, 225, 5, 52, 0, 0, 225, 19, 1, 0, 0, 0, 226,
  227, 7, 0, 0, 0, 227, 21, 1, 0, 0, 0, 228, 229, 5, 55, 0, 0, 229, 23, 1, 0, 0, 0, 230, 232, 3, 32,
  16, 0, 231, 230, 1, 0, 0, 0, 232, 233, 1, 0, 0, 0, 233, 231, 1, 0, 0, 0, 233, 234, 1, 0, 0, 0,
  234, 25, 1, 0, 0, 0, 235, 237, 5, 40, 0, 0, 236, 238, 3, 96, 48, 0, 237, 236, 1, 0, 0, 0, 237,
  238, 1, 0, 0, 0, 238, 240, 1, 0, 0, 0, 239, 241, 5, 27, 0, 0, 240, 239, 1, 0, 0, 0, 240, 241, 1,
  0, 0, 0, 241, 248, 1, 0, 0, 0, 242, 243, 5, 51, 0, 0, 243, 245, 3, 58, 29, 0, 244, 246, 5, 63, 0,
  0, 245, 244, 1, 0, 0, 0, 245, 246, 1, 0, 0, 0, 246, 248, 1, 0, 0, 0, 247, 235, 1, 0, 0, 0, 247,
  242, 1, 0, 0, 0, 248, 27, 1, 0, 0, 0, 249, 250, 3, 30, 15, 0, 250, 29, 1, 0, 0, 0, 251, 252, 5,
  61, 0, 0, 252, 31, 1, 0, 0, 0, 253, 269, 3, 84, 42, 0, 254, 269, 3, 34, 17, 0, 255, 269, 3, 36,
  18, 0, 256, 269, 3, 94, 47, 0, 257, 269, 3, 38, 19, 0, 258, 269, 3, 42, 21, 0, 259, 261, 3, 58,
  29, 0, 260, 262, 5, 63, 0, 0, 261, 260, 1, 0, 0, 0, 261, 262, 1, 0, 0, 0, 262, 269, 1, 0, 0, 0,
  263, 269, 3, 26, 13, 0, 264, 269, 3, 28, 14, 0, 265, 269, 3, 76, 38, 0, 266, 267, 5, 60, 0, 0,
  267, 269, 6, 16, -1, 0, 268, 253, 1, 0, 0, 0, 268, 254, 1, 0, 0, 0, 268, 255, 1, 0, 0, 0, 268,
  256, 1, 0, 0, 0, 268, 257, 1, 0, 0, 0, 268, 258, 1, 0, 0, 0, 268, 259, 1, 0, 0, 0, 268, 263, 1, 0,
  0, 0, 268, 264, 1, 0, 0, 0, 268, 265, 1, 0, 0, 0, 268, 266, 1, 0, 0, 0, 269, 33, 1, 0, 0, 0, 270,
  271, 5, 42, 0, 0, 271, 274, 3, 92, 46, 0, 272, 274, 5, 42, 0, 0, 273, 270, 1, 0, 0, 0, 273, 272,
  1, 0, 0, 0, 274, 35, 1, 0, 0, 0, 275, 276, 5, 44, 0, 0, 276, 279, 3, 92, 46, 0, 277, 279, 5, 44,
  0, 0, 278, 275, 1, 0, 0, 0, 278, 277, 1, 0, 0, 0, 279, 37, 1, 0, 0, 0, 280, 283, 3, 40, 20, 0,
  281, 284, 5, 27, 0, 0, 282, 284, 3, 92, 46, 0, 283, 281, 1, 0, 0, 0, 283, 282, 1, 0, 0, 0, 283,
  284, 1, 0, 0, 0, 284, 39, 1, 0, 0, 0, 285, 287, 3, 56, 28, 0, 286, 285, 1, 0, 0, 0, 286, 287, 1,
  0, 0, 0, 287, 288, 1, 0, 0, 0, 288, 289, 5, 41, 0, 0, 289, 295, 3, 62, 31, 0, 290, 292, 5, 30, 0,
  0, 291, 293, 3, 70, 35, 0, 292, 291, 1, 0, 0, 0, 292, 293, 1, 0, 0, 0, 293, 294, 1, 0, 0, 0, 294,
  296, 5, 31, 0, 0, 295, 290, 1, 0, 0, 0, 295, 296, 1, 0, 0, 0, 296, 302, 1, 0, 0, 0, 297, 299, 3,
  56, 28, 0, 298, 297, 1, 0, 0, 0, 298, 299, 1, 0, 0, 0, 299, 300, 1, 0, 0, 0, 300, 302, 5, 41, 0,
  0, 301, 286, 1, 0, 0, 0, 301, 298, 1, 0, 0, 0, 302, 41, 1, 0, 0, 0, 303, 306, 3, 44, 22, 0, 304,
  307, 5, 27, 0, 0, 305, 307, 3, 92, 46, 0, 306, 304, 1, 0, 0, 0, 306, 305, 1, 0, 0, 0, 306, 307, 1,
  0, 0, 0, 307, 43, 1, 0, 0, 0, 308, 310, 3, 56, 28, 0, 309, 308, 1, 0, 0, 0, 309, 310, 1, 0, 0, 0,
  310, 319, 1, 0, 0, 0, 311, 312, 3, 48, 24, 0, 312, 313, 5, 10, 0, 0, 313, 315, 1, 0, 0, 0, 314,
  311, 1, 0, 0, 0, 314, 315, 1, 0, 0, 0, 315, 316, 1, 0, 0, 0, 316, 317, 3, 50, 25, 0, 317, 318, 5,
  53, 0, 0, 318, 320, 1, 0, 0, 0, 319, 314, 1, 0, 0, 0, 319, 320, 1, 0, 0, 0, 320, 321, 1, 0, 0, 0,
  321, 332, 3, 46, 23, 0, 322, 332, 3, 56, 28, 0, 323, 324, 3, 48, 24, 0, 324, 325, 5, 10, 0, 0,
  325, 327, 1, 0, 0, 0, 326, 323, 1, 0, 0, 0, 326, 327, 1, 0, 0, 0, 327, 328, 1, 0, 0, 0, 328, 329,
  3, 50, 25, 0, 329, 330, 5, 53, 0, 0, 330, 332, 1, 0, 0, 0, 331, 309, 1, 0, 0, 0, 331, 322, 1, 0,
  0, 0, 331, 326, 1, 0, 0, 0, 332, 45, 1, 0, 0, 0, 333, 338, 3, 52, 26, 0, 334, 335, 5, 53, 0, 0,
  335, 337, 3, 52, 26, 0, 336, 334, 1, 0, 0, 0, 337, 340, 1, 0, 0, 0, 338, 336, 1, 0, 0, 0, 338,
  339, 1, 0, 0, 0, 339, 47, 1, 0, 0, 0, 340, 338, 1, 0, 0, 0, 341, 342, 7, 0, 0, 0, 342, 49, 1, 0,
  0, 0, 343, 344, 7, 0, 0, 0, 344, 51, 1, 0, 0, 0, 345, 347, 3, 68, 34, 0, 346, 348, 3, 54, 27, 0,
  347, 346, 1, 0, 0, 0, 347, 348, 1, 0, 0, 0, 348, 53, 1, 0, 0, 0, 349, 351, 5, 30, 0, 0, 350, 352,
  3, 70, 35, 0, 351, 350, 1, 0, 0, 0, 351, 352, 1, 0, 0, 0, 352, 353, 1, 0, 0, 0, 353, 354, 5, 31,
  0, 0, 354, 55, 1, 0, 0, 0, 355, 357, 3, 64, 32, 0, 356, 355, 1, 0, 0, 0, 356, 357, 1, 0, 0, 0,
  357, 358, 1, 0, 0, 0, 358, 359, 3, 66, 33, 0, 359, 360, 5, 29, 0, 0, 360, 57, 1, 0, 0, 0, 361,
  362, 3, 48, 24, 0, 362, 363, 5, 10, 0, 0, 363, 365, 1, 0, 0, 0, 364, 361, 1, 0, 0, 0, 364, 365, 1,
  0, 0, 0, 365, 366, 1, 0, 0, 0, 366, 367, 3, 50, 25, 0, 367, 368, 5, 7, 0, 0, 368, 369, 3, 60, 30,
  0, 369, 376, 1, 0, 0, 0, 370, 371, 3, 48, 24, 0, 371, 373, 7, 3, 0, 0, 372, 374, 3, 50, 25, 0,
  373, 372, 1, 0, 0, 0, 373, 374, 1, 0, 0, 0, 374, 376, 1, 0, 0, 0, 375, 364, 1, 0, 0, 0, 375, 370,
  1, 0, 0, 0, 376, 59, 1, 0, 0, 0, 377, 378, 5, 62, 0, 0, 378, 61, 1, 0, 0, 0, 379, 380, 7, 0, 0, 0,
  380, 63, 1, 0, 0, 0, 381, 382, 7, 0, 0, 0, 382, 65, 1, 0, 0, 0, 383, 394, 3, 98, 49, 0, 384, 389,
  5, 54, 0, 0, 385, 386, 5, 28, 0, 0, 386, 388, 5, 54, 0, 0, 387, 385, 1, 0, 0, 0, 388, 391, 1, 0,
  0, 0, 389, 387, 1, 0, 0, 0, 389, 390, 1, 0, 0, 0, 390, 394, 1, 0, 0, 0, 391, 389, 1, 0, 0, 0, 392,
  394, 5, 57, 0, 0, 393, 383, 1, 0, 0, 0, 393, 384, 1, 0, 0, 0, 393, 392, 1, 0, 0, 0, 394, 67, 1, 0,
  0, 0, 395, 396, 7, 0, 0, 0, 396, 69, 1, 0, 0, 0, 397, 402, 3, 72, 36, 0, 398, 399, 5, 28, 0, 0,
  399, 401, 3, 72, 36, 0, 400, 398, 1, 0, 0, 0, 401, 404, 1, 0, 0, 0, 402, 400, 1, 0, 0, 0, 402,
  403, 1, 0, 0, 0, 403, 406, 1, 0, 0, 0, 404, 402, 1, 0, 0, 0, 405, 407, 5, 28, 0, 0, 406, 405, 1,
  0, 0, 0, 406, 407, 1, 0, 0, 0, 407, 71, 1, 0, 0, 0, 408, 411, 3, 74, 37, 0, 409, 411, 3, 96, 48,
  0, 410, 408, 1, 0, 0, 0, 410, 409, 1, 0, 0, 0, 411, 73, 1, 0, 0, 0, 412, 413, 3, 64, 32, 0, 413,
  414, 5, 54, 0, 0, 414, 75, 1, 0, 0, 0, 415, 419, 3, 78, 39, 0, 416, 418, 3, 80, 40, 0, 417, 416,
  1, 0, 0, 0, 418, 421, 1, 0, 0, 0, 419, 417, 1, 0, 0, 0, 419, 420, 1, 0, 0, 0, 420, 423, 1, 0, 0,
  0, 421, 419, 1, 0, 0, 0, 422, 424, 3, 82, 41, 0, 423, 422, 1, 0, 0, 0, 423, 424, 1, 0, 0, 0, 424,
  77, 1, 0, 0, 0, 425, 426, 5, 46, 0, 0, 426, 427, 3, 92, 46, 0, 427, 79, 1, 0, 0, 0, 428, 430, 5,
  47, 0, 0, 429, 431, 3, 54, 27, 0, 430, 429, 1, 0, 0, 0, 430, 431, 1, 0, 0, 0, 431, 432, 1, 0, 0,
  0, 432, 433, 3, 92, 46, 0, 433, 81, 1, 0, 0, 0, 434, 435, 5, 48, 0, 0, 435, 436, 3, 92, 46, 0,
  436, 83, 1, 0, 0, 0, 437, 441, 3, 86, 43, 0, 438, 440, 3, 88, 44, 0, 439, 438, 1, 0, 0, 0, 440,
  443, 1, 0, 0, 0, 441, 439, 1, 0, 0, 0, 441, 442, 1, 0, 0, 0, 442, 445, 1, 0, 0, 0, 443, 441, 1, 0,
  0, 0, 444, 446, 3, 90, 45, 0, 445, 444, 1, 0, 0, 0, 445, 446, 1, 0, 0, 0, 446, 85, 1, 0, 0, 0,
  447, 448, 5, 37, 0, 0, 448, 449, 3, 100, 50, 0, 449, 450, 3, 92, 46, 0, 450, 87, 1, 0, 0, 0, 451,
  452, 5, 38, 0, 0, 452, 453, 5, 37, 0, 0, 453, 454, 3, 100, 50, 0, 454, 455, 3, 92, 46, 0, 455, 89,
  1, 0, 0, 0, 456, 457, 5, 38, 0, 0, 457, 458, 3, 92, 46, 0, 458, 91, 1, 0, 0, 0, 459, 461, 5, 32,
  0, 0, 460, 462, 3, 24, 12, 0, 461, 460, 1, 0, 0, 0, 461, 462, 1, 0, 0, 0, 462, 463, 1, 0, 0, 0,
  463, 464, 5, 33, 0, 0, 464, 93, 1, 0, 0, 0, 465, 466, 5, 39, 0, 0, 466, 467, 3, 100, 50, 0, 467,
  468, 3, 92, 46, 0, 468, 473, 1, 0, 0, 0, 469, 470, 5, 39, 0, 0, 470, 473, 3, 100, 50, 0, 471, 473,
  5, 39, 0, 0, 472, 465, 1, 0, 0, 0, 472, 469, 1, 0, 0, 0, 472, 471, 1, 0, 0, 0, 473, 95, 1, 0, 0,
  0, 474, 475, 6, 48, -1, 0, 475, 495, 3, 98, 49, 0, 476, 477, 5, 21, 0, 0, 477, 495, 3, 96, 48, 13,
  478, 479, 5, 26, 0, 0, 479, 495, 3, 96, 48, 12, 480, 481, 3, 50, 25, 0, 481, 482, 5, 53, 0, 0,
  482, 484, 1, 0, 0, 0, 483, 480, 1, 0, 0, 0, 483, 484, 1, 0, 0, 0, 484, 485, 1, 0, 0, 0, 485, 495,
  3, 46, 23, 0, 486, 495, 3, 38, 19, 0, 487, 488, 5, 30, 0, 0, 488, 489, 3, 96, 48, 0, 489, 490, 5,
  31, 0, 0, 490, 495, 1, 0, 0, 0, 491, 492, 3, 56, 28, 0, 492, 493, 3, 96, 48, 1, 493, 495, 1, 0, 0,
  0, 494, 474, 1, 0, 0, 0, 494, 476, 1, 0, 0, 0, 494, 478, 1, 0, 0, 0, 494, 483, 1, 0, 0, 0, 494,
  486, 1, 0, 0, 0, 494, 487, 1, 0, 0, 0, 494, 491, 1, 0, 0, 0, 495, 519, 1, 0, 0, 0, 496, 497, 10,
  11, 0, 0, 497, 498, 7, 4, 0, 0, 498, 518, 3, 96, 48, 12, 499, 500, 10, 10, 0, 0, 500, 501, 7, 5,
  0, 0, 501, 518, 3, 96, 48, 11, 502, 503, 10, 9, 0, 0, 503, 504, 7, 6, 0, 0, 504, 518, 3, 96, 48,
  10, 505, 506, 10, 8, 0, 0, 506, 507, 7, 7, 0, 0, 507, 518, 3, 96, 48, 9, 508, 509, 10, 7, 0, 0,
  509, 510, 5, 13, 0, 0, 510, 518, 3, 96, 48, 8, 511, 512, 10, 6, 0, 0, 512, 513, 5, 12, 0, 0, 513,
  518, 3, 96, 48, 7, 514, 515, 10, 5, 0, 0, 515, 516, 5, 20, 0, 0, 516, 518, 3, 96, 48, 6, 517, 496,
  1, 0, 0, 0, 517, 499, 1, 0, 0, 0, 517, 502, 1, 0, 0, 0, 517, 505, 1, 0, 0, 0, 517, 508, 1, 0, 0,
  0, 517, 511, 1, 0, 0, 0, 517, 514, 1, 0, 0, 0, 518, 521, 1, 0, 0, 0, 519, 517, 1, 0, 0, 0, 519,
  520, 1, 0, 0, 0, 520, 97, 1, 0, 0, 0, 521, 519, 1, 0, 0, 0, 522, 528, 7, 8, 0, 0, 523, 528, 7, 9,
  0, 0, 524, 528, 5, 54, 0, 0, 525, 528, 5, 57, 0, 0, 526, 528, 5, 36, 0, 0, 527, 522, 1, 0, 0, 0,
  527, 523, 1, 0, 0, 0, 527, 524, 1, 0, 0, 0, 527, 525, 1, 0, 0, 0, 527, 526, 1, 0, 0, 0, 528, 99,
  1, 0, 0, 0, 529, 530, 5, 30, 0, 0, 530, 531, 3, 102, 51, 0, 531, 532, 5, 31, 0, 0, 532, 539, 1, 0,
  0, 0, 533, 534, 5, 30, 0, 0, 534, 539, 3, 102, 51, 0, 535, 536, 5, 30, 0, 0, 536, 539, 5, 31, 0,
  0, 537, 539, 5, 30, 0, 0, 538, 529, 1, 0, 0, 0, 538, 533, 1, 0, 0, 0, 538, 535, 1, 0, 0, 0, 538,
  537, 1, 0, 0, 0, 539, 101, 1, 0, 0, 0, 540, 544, 3, 98, 49, 0, 541, 544, 3, 96, 48, 0, 542, 544,
  3, 104, 52, 0, 543, 540, 1, 0, 0, 0, 543, 541, 1, 0, 0, 0, 543, 542, 1, 0, 0, 0, 544, 103, 1, 0,
  0, 0, 545, 546, 5, 54, 0, 0, 546, 547, 5, 49, 0, 0, 547, 548, 5, 54, 0, 0, 548, 105, 1, 0, 0, 0,
  76, 107, 111, 117, 120, 125, 130, 134, 136, 140, 142, 146, 150, 156, 162, 167, 169, 174, 177, 180,
  185, 188, 192, 195, 198, 202, 211, 215, 217, 222, 233, 237, 240, 245, 247, 261, 268, 273, 278,
  283, 286, 292, 295, 298, 301, 306, 309, 314, 319, 326, 331, 338, 347, 351, 356, 364, 373, 375,
  389, 393, 402, 406, 410, 419, 423, 430, 441, 445, 461, 472, 483, 494, 517, 519, 527, 538, 543,
];

const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map((ds, index) => new antlr4.dfa.DFA(ds, index));

const sharedContextCache = new antlr4.PredictionContextCache();

export default class sequenceParser extends antlr4.Parser {
  static grammarFileName = 'java-escape';
  static literalNames = [
    null,
    null,
    "'const'",
    "'readonly'",
    "'static'",
    "'await'",
    "'title'",
    "':'",
    "'<<'",
    "'>>'",
    "'->'",
    null,
    "'||'",
    "'&&'",
    "'=='",
    "'!='",
    "'>'",
    "'<'",
    "'>='",
    "'<='",
    "'+'",
    "'-'",
    "'*'",
    "'/'",
    "'%'",
    "'^'",
    "'!'",
    "';'",
    "','",
    "'='",
    "'('",
    "')'",
    "'{'",
    "'}'",
    "'true'",
    "'false'",
    null,
    "'if'",
    "'else'",
    null,
    "'return'",
    "'new'",
    "'par'",
    "'group'",
    "'opt'",
    "'as'",
    "'try'",
    "'catch'",
    "'finally'",
    "'in'",
    null,
    null,
    null,
    "'.'",
  ];
  static symbolicNames = [
    null,
    'WS',
    'CONSTANT',
    'READONLY',
    'STATIC',
    'AWAIT',
    'TITLE',
    'COL',
    'SOPEN',
    'SCLOSE',
    'ARROW',
    'COLOR',
    'OR',
    'AND',
    'EQ',
    'NEQ',
    'GT',
    'LT',
    'GTEQ',
    'LTEQ',
    'PLUS',
    'MINUS',
    'MULT',
    'DIV',
    'MOD',
    'POW',
    'NOT',
    'SCOL',
    'COMMA',
    'ASSIGN',
    'OPAR',
    'CPAR',
    'OBRACE',
    'CBRACE',
    'TRUE',
    'FALSE',
    'NIL',
    'IF',
    'ELSE',
    'WHILE',
    'RETURN',
    'NEW',
    'PAR',
    'GROUP',
    'OPT',
    'AS',
    'TRY',
    'CATCH',
    'FINALLY',
    'IN',
    'STARTER_LXR',
    'ANNOTATION_RET',
    'ANNOTATION',
    'DOT',
    'ID',
    'INT',
    'FLOAT',
    'STRING',
    'CR',
    'COMMENT',
    'OTHER',
    'DIVIDER',
    'EVENT_PAYLOAD_LXR',
    'EVENT_END',
    'TITLE_CONTENT',
    'TITLE_END',
  ];
  static ruleNames = [
    'prog',
    'title',
    'head',
    'group',
    'starterExp',
    'starter',
    'participant',
    'stereotype',
    'label',
    'participantType',
    'name',
    'width',
    'block',
    'ret',
    'divider',
    'dividerNote',
    'stat',
    'par',
    'opt',
    'creation',
    'creationBody',
    'message',
    'messageBody',
    'func',
    'from',
    'to',
    'signature',
    'invocation',
    'assignment',
    'asyncMessage',
    'content',
    'construct',
    'type',
    'assignee',
    'methodName',
    'parameters',
    'parameter',
    'declaration',
    'tcf',
    'tryBlock',
    'catchBlock',
    'finallyBlock',
    'alt',
    'ifBlock',
    'elseIfBlock',
    'elseBlock',
    'braceBlock',
    'loop',
    'expr',
    'atom',
    'parExpr',
    'condition',
    'inExpr',
  ];

  constructor(input) {
    super(input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = sequenceParser.ruleNames;
    this.literalNames = sequenceParser.literalNames;
    this.symbolicNames = sequenceParser.symbolicNames;
  }

  get atn() {
    return atn;
  }

  sempred(localctx, ruleIndex, predIndex) {
    switch (ruleIndex) {
      case 48:
        return this.expr_sempred(localctx, predIndex);
      default:
        throw 'No predicate with index:' + ruleIndex;
    }
  }

  expr_sempred(localctx, predIndex) {
    switch (predIndex) {
      case 0:
        return this.precpred(this._ctx, 11);
      case 1:
        return this.precpred(this._ctx, 10);
      case 2:
        return this.precpred(this._ctx, 9);
      case 3:
        return this.precpred(this._ctx, 8);
      case 4:
        return this.precpred(this._ctx, 7);
      case 5:
        return this.precpred(this._ctx, 6);
      case 6:
        return this.precpred(this._ctx, 5);
      default:
        throw 'No predicate with index:' + predIndex;
    }
  }

  prog() {
    let localctx = new ProgContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, sequenceParser.RULE_prog);
    var _la = 0; // Token type
    try {
      this.state = 125;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 4, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 107;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 6) {
            this.state = 106;
            this.title();
          }

          this.state = 109;
          this.match(sequenceParser.EOF);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 111;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 6) {
            this.state = 110;
            this.title();
          }

          this.state = 113;
          this.head();
          this.state = 114;
          this.match(sequenceParser.EOF);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 117;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 6) {
            this.state = 116;
            this.title();
          }

          this.state = 120;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 3, this._ctx);
          if (la_ === 1) {
            this.state = 119;
            this.head();
          }
          this.state = 122;
          this.block();
          this.state = 123;
          this.match(sequenceParser.EOF);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  title() {
    let localctx = new TitleContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, sequenceParser.RULE_title);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 127;
      this.match(sequenceParser.TITLE);
      this.state = 128;
      this.match(sequenceParser.TITLE_CONTENT);
      this.state = 130;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 65) {
        this.state = 129;
        this.match(sequenceParser.TITLE_END);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  head() {
    let localctx = new HeadContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, sequenceParser.RULE_head);
    try {
      this.state = 146;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 10, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 134;
          this._errHandler.sync(this);
          var _alt = 1;
          do {
            switch (_alt) {
              case 1:
                this.state = 134;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                  case 43:
                    this.state = 132;
                    this.group();
                    break;
                  case 8:
                  case 17:
                  case 52:
                  case 54:
                  case 57:
                    this.state = 133;
                    this.participant();
                    break;
                  default:
                    throw new antlr4.error.NoViableAltException(this);
                }
                break;
              default:
                throw new antlr4.error.NoViableAltException(this);
            }
            this.state = 136;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input, 7, this._ctx);
          } while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 142;
          this._errHandler.sync(this);
          var _alt = this._interp.adaptivePredict(this._input, 9, this._ctx);
          while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if (_alt === 1) {
              this.state = 140;
              this._errHandler.sync(this);
              switch (this._input.LA(1)) {
                case 43:
                  this.state = 138;
                  this.group();
                  break;
                case 8:
                case 17:
                case 52:
                case 54:
                case 57:
                  this.state = 139;
                  this.participant();
                  break;
                default:
                  throw new antlr4.error.NoViableAltException(this);
              }
            }
            this.state = 144;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input, 9, this._ctx);
          }

          this.state = 145;
          this.starterExp();
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  group() {
    let localctx = new GroupContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, sequenceParser.RULE_group);
    var _la = 0; // Token type
    try {
      this.state = 169;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 15, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 148;
          this.match(sequenceParser.GROUP);
          this.state = 150;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 54 || _la === 57) {
            this.state = 149;
            this.name();
          }

          this.state = 152;
          this.match(sequenceParser.OBRACE);
          this.state = 156;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          while (
            _la === 8 ||
            _la === 17 ||
            (((_la - 52) & ~0x1f) == 0 && ((1 << (_la - 52)) & 37) !== 0)
          ) {
            this.state = 153;
            this.participant();
            this.state = 158;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          }
          this.state = 159;
          this.match(sequenceParser.CBRACE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 160;
          this.match(sequenceParser.GROUP);
          this.state = 162;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 54 || _la === 57) {
            this.state = 161;
            this.name();
          }

          this.state = 164;
          this.match(sequenceParser.OBRACE);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 165;
          this.match(sequenceParser.GROUP);
          this.state = 167;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 14, this._ctx);
          if (la_ === 1) {
            this.state = 166;
            this.name();
          }
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  starterExp() {
    let localctx = new StarterExpContext(this, this._ctx, this.state);
    this.enterRule(localctx, 8, sequenceParser.RULE_starterExp);
    var _la = 0; // Token type
    try {
      this.state = 180;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 50:
          this.enterOuterAlt(localctx, 1);
          this.state = 171;
          this.match(sequenceParser.STARTER_LXR);
          this.state = 177;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 30) {
            this.state = 172;
            this.match(sequenceParser.OPAR);
            this.state = 174;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            if (_la === 54 || _la === 57) {
              this.state = 173;
              this.starter();
            }

            this.state = 176;
            this.match(sequenceParser.CPAR);
          }

          break;
        case 52:
          this.enterOuterAlt(localctx, 2);
          this.state = 179;
          this.match(sequenceParser.ANNOTATION);
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  starter() {
    let localctx = new StarterContext(this, this._ctx, this.state);
    this.enterRule(localctx, 10, sequenceParser.RULE_starter);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 182;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  participant() {
    let localctx = new ParticipantContext(this, this._ctx, this.state);
    this.enterRule(localctx, 12, sequenceParser.RULE_participant);
    var _la = 0; // Token type
    try {
      this.state = 202;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 24, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 185;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 52) {
            this.state = 184;
            this.participantType();
          }

          this.state = 188;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 8 || _la === 17) {
            this.state = 187;
            this.stereotype();
          }

          this.state = 190;
          this.name();
          this.state = 192;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 21, this._ctx);
          if (la_ === 1) {
            this.state = 191;
            this.width();
          }
          this.state = 195;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 45) {
            this.state = 194;
            this.label();
          }

          this.state = 198;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 11) {
            this.state = 197;
            this.match(sequenceParser.COLOR);
          }

          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 200;
          this.stereotype();
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 201;
          this.participantType();
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  stereotype() {
    let localctx = new StereotypeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 14, sequenceParser.RULE_stereotype);
    var _la = 0; // Token type
    try {
      this.state = 217;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 27, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 204;
          this.match(sequenceParser.SOPEN);
          this.state = 205;
          this.name();
          this.state = 206;
          this.match(sequenceParser.SCLOSE);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 208;
          this.match(sequenceParser.SOPEN);
          this.state = 209;
          this.name();
          this.state = 211;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 16) {
            this.state = 210;
            this.match(sequenceParser.GT);
          }

          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 213;
          _la = this._input.LA(1);
          if (!(_la === 8 || _la === 17)) {
            this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
          this.state = 215;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 9 || _la === 16) {
            this.state = 214;
            _la = this._input.LA(1);
            if (!(_la === 9 || _la === 16)) {
              this._errHandler.recoverInline(this);
            } else {
              this._errHandler.reportMatch(this);
              this.consume();
            }
          }

          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  label() {
    let localctx = new LabelContext(this, this._ctx, this.state);
    this.enterRule(localctx, 16, sequenceParser.RULE_label);
    try {
      this.state = 222;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 28, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 219;
          this.match(sequenceParser.AS);
          this.state = 220;
          this.name();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 221;
          this.match(sequenceParser.AS);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  participantType() {
    let localctx = new ParticipantTypeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 18, sequenceParser.RULE_participantType);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 224;
      this.match(sequenceParser.ANNOTATION);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  name() {
    let localctx = new NameContext(this, this._ctx, this.state);
    this.enterRule(localctx, 20, sequenceParser.RULE_name);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 226;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  width() {
    let localctx = new WidthContext(this, this._ctx, this.state);
    this.enterRule(localctx, 22, sequenceParser.RULE_width);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 228;
      this.match(sequenceParser.INT);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  block() {
    let localctx = new BlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 24, sequenceParser.RULE_block);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 231;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      do {
        this.state = 230;
        this.stat();
        this.state = 233;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      } while (((_la - 34) & ~0x1f) == 0 && ((1 << (_la - 34)) & 217191919) !== 0);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  ret() {
    let localctx = new RetContext(this, this._ctx, this.state);
    this.enterRule(localctx, 26, sequenceParser.RULE_ret);
    var _la = 0; // Token type
    try {
      this.state = 247;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 40:
          this.enterOuterAlt(localctx, 1);
          this.state = 235;
          this.match(sequenceParser.RETURN);
          this.state = 237;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 30, this._ctx);
          if (la_ === 1) {
            this.state = 236;
            this.expr(0);
          }
          this.state = 240;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 27) {
            this.state = 239;
            this.match(sequenceParser.SCOL);
          }

          break;
        case 51:
          this.enterOuterAlt(localctx, 2);
          this.state = 242;
          this.match(sequenceParser.ANNOTATION_RET);
          this.state = 243;
          this.asyncMessage();
          this.state = 245;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 63) {
            this.state = 244;
            this.match(sequenceParser.EVENT_END);
          }

          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  divider() {
    let localctx = new DividerContext(this, this._ctx, this.state);
    this.enterRule(localctx, 28, sequenceParser.RULE_divider);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 249;
      this.dividerNote();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  dividerNote() {
    let localctx = new DividerNoteContext(this, this._ctx, this.state);
    this.enterRule(localctx, 30, sequenceParser.RULE_dividerNote);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 251;
      this.match(sequenceParser.DIVIDER);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  stat() {
    let localctx = new StatContext(this, this._ctx, this.state);
    this.enterRule(localctx, 32, sequenceParser.RULE_stat);
    var _la = 0; // Token type
    try {
      this.state = 268;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 35, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 253;
          this.alt();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 254;
          this.par();
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 255;
          this.opt();
          break;

        case 4:
          this.enterOuterAlt(localctx, 4);
          this.state = 256;
          this.loop();
          break;

        case 5:
          this.enterOuterAlt(localctx, 5);
          this.state = 257;
          this.creation();
          break;

        case 6:
          this.enterOuterAlt(localctx, 6);
          this.state = 258;
          this.message();
          break;

        case 7:
          this.enterOuterAlt(localctx, 7);
          this.state = 259;
          this.asyncMessage();
          this.state = 261;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (_la === 63) {
            this.state = 260;
            this.match(sequenceParser.EVENT_END);
          }

          break;

        case 8:
          this.enterOuterAlt(localctx, 8);
          this.state = 263;
          this.ret();
          break;

        case 9:
          this.enterOuterAlt(localctx, 9);
          this.state = 264;
          this.divider();
          break;

        case 10:
          this.enterOuterAlt(localctx, 10);
          this.state = 265;
          this.tcf();
          break;

        case 11:
          this.enterOuterAlt(localctx, 11);
          this.state = 266;
          localctx._OTHER = this.match(sequenceParser.OTHER);
          console.log('unknown char: ' + (localctx._OTHER === null ? null : localctx._OTHER.text));
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  par() {
    let localctx = new ParContext(this, this._ctx, this.state);
    this.enterRule(localctx, 34, sequenceParser.RULE_par);
    try {
      this.state = 273;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 36, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 270;
          this.match(sequenceParser.PAR);
          this.state = 271;
          this.braceBlock();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 272;
          this.match(sequenceParser.PAR);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  opt() {
    let localctx = new OptContext(this, this._ctx, this.state);
    this.enterRule(localctx, 36, sequenceParser.RULE_opt);
    try {
      this.state = 278;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 37, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 275;
          this.match(sequenceParser.OPT);
          this.state = 276;
          this.braceBlock();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 277;
          this.match(sequenceParser.OPT);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  creation() {
    let localctx = new CreationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 38, sequenceParser.RULE_creation);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 280;
      this.creationBody();
      this.state = 283;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 38, this._ctx);
      if (la_ === 1) {
        this.state = 281;
        this.match(sequenceParser.SCOL);
      } else if (la_ === 2) {
        this.state = 282;
        this.braceBlock();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  creationBody() {
    let localctx = new CreationBodyContext(this, this._ctx, this.state);
    this.enterRule(localctx, 40, sequenceParser.RULE_creationBody);
    var _la = 0; // Token type
    try {
      this.state = 301;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 43, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 286;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((_la - 34) & ~0x1f) == 0 && ((1 << (_la - 34)) & 15728647) !== 0) {
            this.state = 285;
            this.assignment();
          }

          this.state = 288;
          this.match(sequenceParser.NEW);
          this.state = 289;
          this.construct();
          this.state = 295;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 41, this._ctx);
          if (la_ === 1) {
            this.state = 290;
            this.match(sequenceParser.OPAR);
            this.state = 292;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            if (
              ((_la & ~0x1f) == 0 && ((1 << _la) & 1142947840) !== 0) ||
              (((_la - 34) & ~0x1f) == 0 && ((1 << (_la - 34)) & 15728775) !== 0)
            ) {
              this.state = 291;
              this.parameters();
            }

            this.state = 294;
            this.match(sequenceParser.CPAR);
          }
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 298;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          if (((_la - 34) & ~0x1f) == 0 && ((1 << (_la - 34)) & 15728647) !== 0) {
            this.state = 297;
            this.assignment();
          }

          this.state = 300;
          this.match(sequenceParser.NEW);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  message() {
    let localctx = new MessageContext(this, this._ctx, this.state);
    this.enterRule(localctx, 42, sequenceParser.RULE_message);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 303;
      this.messageBody();
      this.state = 306;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 27:
          this.state = 304;
          this.match(sequenceParser.SCOL);
          break;
        case 32:
          this.state = 305;
          this.braceBlock();
          break;
        case -1:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 39:
        case 40:
        case 41:
        case 42:
        case 44:
        case 46:
        case 51:
        case 54:
        case 55:
        case 56:
        case 57:
        case 60:
        case 61:
          break;
        default:
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  messageBody() {
    let localctx = new MessageBodyContext(this, this._ctx, this.state);
    this.enterRule(localctx, 44, sequenceParser.RULE_messageBody);
    try {
      this.state = 331;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 49, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 309;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 45, this._ctx);
          if (la_ === 1) {
            this.state = 308;
            this.assignment();
          }
          this.state = 319;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 47, this._ctx);
          if (la_ === 1) {
            this.state = 314;
            this._errHandler.sync(this);
            var la_ = this._interp.adaptivePredict(this._input, 46, this._ctx);
            if (la_ === 1) {
              this.state = 311;
              this.from();
              this.state = 312;
              this.match(sequenceParser.ARROW);
            }
            this.state = 316;
            this.to();
            this.state = 317;
            this.match(sequenceParser.DOT);
          }
          this.state = 321;
          this.func();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 322;
          this.assignment();
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 326;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 48, this._ctx);
          if (la_ === 1) {
            this.state = 323;
            this.from();
            this.state = 324;
            this.match(sequenceParser.ARROW);
          }
          this.state = 328;
          this.to();
          this.state = 329;
          this.match(sequenceParser.DOT);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  func() {
    let localctx = new FuncContext(this, this._ctx, this.state);
    this.enterRule(localctx, 46, sequenceParser.RULE_func);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 333;
      this.signature();
      this.state = 338;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 50, this._ctx);
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          this.state = 334;
          this.match(sequenceParser.DOT);
          this.state = 335;
          this.signature();
        }
        this.state = 340;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 50, this._ctx);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  from() {
    let localctx = new FromContext(this, this._ctx, this.state);
    this.enterRule(localctx, 48, sequenceParser.RULE_from);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 341;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  to() {
    let localctx = new ToContext(this, this._ctx, this.state);
    this.enterRule(localctx, 50, sequenceParser.RULE_to);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 343;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  signature() {
    let localctx = new SignatureContext(this, this._ctx, this.state);
    this.enterRule(localctx, 52, sequenceParser.RULE_signature);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 345;
      this.methodName();
      this.state = 347;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 51, this._ctx);
      if (la_ === 1) {
        this.state = 346;
        this.invocation();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  invocation() {
    let localctx = new InvocationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 54, sequenceParser.RULE_invocation);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 349;
      this.match(sequenceParser.OPAR);
      this.state = 351;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (
        ((_la & ~0x1f) == 0 && ((1 << _la) & 1142947840) !== 0) ||
        (((_la - 34) & ~0x1f) == 0 && ((1 << (_la - 34)) & 15728775) !== 0)
      ) {
        this.state = 350;
        this.parameters();
      }

      this.state = 353;
      this.match(sequenceParser.CPAR);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  assignment() {
    let localctx = new AssignmentContext(this, this._ctx, this.state);
    this.enterRule(localctx, 56, sequenceParser.RULE_assignment);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 356;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 53, this._ctx);
      if (la_ === 1) {
        this.state = 355;
        this.type();
      }
      this.state = 358;
      this.assignee();
      this.state = 359;
      this.match(sequenceParser.ASSIGN);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  asyncMessage() {
    let localctx = new AsyncMessageContext(this, this._ctx, this.state);
    this.enterRule(localctx, 58, sequenceParser.RULE_asyncMessage);
    var _la = 0; // Token type
    try {
      this.state = 375;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 56, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 364;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 54, this._ctx);
          if (la_ === 1) {
            this.state = 361;
            this.from();
            this.state = 362;
            this.match(sequenceParser.ARROW);
          }
          this.state = 366;
          this.to();
          this.state = 367;
          this.match(sequenceParser.COL);
          this.state = 368;
          this.content();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 370;
          this.from();
          this.state = 371;
          _la = this._input.LA(1);
          if (!(_la === 10 || _la === 21)) {
            this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
          this.state = 373;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 55, this._ctx);
          if (la_ === 1) {
            this.state = 372;
            this.to();
          }
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  content() {
    let localctx = new ContentContext(this, this._ctx, this.state);
    this.enterRule(localctx, 60, sequenceParser.RULE_content);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 377;
      this.match(sequenceParser.EVENT_PAYLOAD_LXR);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  construct() {
    let localctx = new ConstructContext(this, this._ctx, this.state);
    this.enterRule(localctx, 62, sequenceParser.RULE_construct);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 379;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  type() {
    let localctx = new TypeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 64, sequenceParser.RULE_type);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 381;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  assignee() {
    let localctx = new AssigneeContext(this, this._ctx, this.state);
    this.enterRule(localctx, 66, sequenceParser.RULE_assignee);
    var _la = 0; // Token type
    try {
      this.state = 393;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 58, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 383;
          this.atom();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 384;
          this.match(sequenceParser.ID);
          this.state = 389;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
          while (_la === 28) {
            this.state = 385;
            this.match(sequenceParser.COMMA);
            this.state = 386;
            this.match(sequenceParser.ID);
            this.state = 391;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
          }
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 392;
          this.match(sequenceParser.STRING);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  methodName() {
    let localctx = new MethodNameContext(this, this._ctx, this.state);
    this.enterRule(localctx, 68, sequenceParser.RULE_methodName);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 395;
      _la = this._input.LA(1);
      if (!(_la === 54 || _la === 57)) {
        this._errHandler.recoverInline(this);
      } else {
        this._errHandler.reportMatch(this);
        this.consume();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  parameters() {
    let localctx = new ParametersContext(this, this._ctx, this.state);
    this.enterRule(localctx, 70, sequenceParser.RULE_parameters);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 397;
      this.parameter();
      this.state = 402;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 59, this._ctx);
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          this.state = 398;
          this.match(sequenceParser.COMMA);
          this.state = 399;
          this.parameter();
        }
        this.state = 404;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 59, this._ctx);
      }

      this.state = 406;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 28) {
        this.state = 405;
        this.match(sequenceParser.COMMA);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  parameter() {
    let localctx = new ParameterContext(this, this._ctx, this.state);
    this.enterRule(localctx, 72, sequenceParser.RULE_parameter);
    try {
      this.state = 410;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 61, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 408;
          this.declaration();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 409;
          this.expr(0);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  declaration() {
    let localctx = new DeclarationContext(this, this._ctx, this.state);
    this.enterRule(localctx, 74, sequenceParser.RULE_declaration);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 412;
      this.type();
      this.state = 413;
      this.match(sequenceParser.ID);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  tcf() {
    let localctx = new TcfContext(this, this._ctx, this.state);
    this.enterRule(localctx, 76, sequenceParser.RULE_tcf);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 415;
      this.tryBlock();
      this.state = 419;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      while (_la === 47) {
        this.state = 416;
        this.catchBlock();
        this.state = 421;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
      }
      this.state = 423;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 48) {
        this.state = 422;
        this.finallyBlock();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  tryBlock() {
    let localctx = new TryBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 78, sequenceParser.RULE_tryBlock);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 425;
      this.match(sequenceParser.TRY);
      this.state = 426;
      this.braceBlock();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  catchBlock() {
    let localctx = new CatchBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 80, sequenceParser.RULE_catchBlock);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 428;
      this.match(sequenceParser.CATCH);
      this.state = 430;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 30) {
        this.state = 429;
        this.invocation();
      }

      this.state = 432;
      this.braceBlock();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  finallyBlock() {
    let localctx = new FinallyBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 82, sequenceParser.RULE_finallyBlock);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 434;
      this.match(sequenceParser.FINALLY);
      this.state = 435;
      this.braceBlock();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  alt() {
    let localctx = new AltContext(this, this._ctx, this.state);
    this.enterRule(localctx, 84, sequenceParser.RULE_alt);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 437;
      this.ifBlock();
      this.state = 441;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 65, this._ctx);
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          this.state = 438;
          this.elseIfBlock();
        }
        this.state = 443;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 65, this._ctx);
      }

      this.state = 445;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (_la === 38) {
        this.state = 444;
        this.elseBlock();
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  ifBlock() {
    let localctx = new IfBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 86, sequenceParser.RULE_ifBlock);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 447;
      this.match(sequenceParser.IF);
      this.state = 448;
      this.parExpr();
      this.state = 449;
      this.braceBlock();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  elseIfBlock() {
    let localctx = new ElseIfBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 88, sequenceParser.RULE_elseIfBlock);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 451;
      this.match(sequenceParser.ELSE);
      this.state = 452;
      this.match(sequenceParser.IF);
      this.state = 453;
      this.parExpr();
      this.state = 454;
      this.braceBlock();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  elseBlock() {
    let localctx = new ElseBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 90, sequenceParser.RULE_elseBlock);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 456;
      this.match(sequenceParser.ELSE);
      this.state = 457;
      this.braceBlock();
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  braceBlock() {
    let localctx = new BraceBlockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 92, sequenceParser.RULE_braceBlock);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 459;
      this.match(sequenceParser.OBRACE);
      this.state = 461;
      this._errHandler.sync(this);
      _la = this._input.LA(1);
      if (((_la - 34) & ~0x1f) == 0 && ((1 << (_la - 34)) & 217191919) !== 0) {
        this.state = 460;
        this.block();
      }

      this.state = 463;
      this.match(sequenceParser.CBRACE);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  loop() {
    let localctx = new LoopContext(this, this._ctx, this.state);
    this.enterRule(localctx, 94, sequenceParser.RULE_loop);
    try {
      this.state = 472;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 68, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 465;
          this.match(sequenceParser.WHILE);
          this.state = 466;
          this.parExpr();
          this.state = 467;
          this.braceBlock();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 469;
          this.match(sequenceParser.WHILE);
          this.state = 470;
          this.parExpr();
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 471;
          this.match(sequenceParser.WHILE);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  expr(_p) {
    if (_p === undefined) {
      _p = 0;
    }
    const _parentctx = this._ctx;
    const _parentState = this.state;
    let localctx = new ExprContext(this, this._ctx, _parentState);
    let _prevctx = localctx;
    const _startState = 96;
    this.enterRecursionRule(localctx, 96, sequenceParser.RULE_expr, _p);
    var _la = 0; // Token type
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 494;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 70, this._ctx);
      switch (la_) {
        case 1:
          localctx = new AtomExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;

          this.state = 475;
          this.atom();
          break;

        case 2:
          localctx = new UnaryMinusExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 476;
          this.match(sequenceParser.MINUS);
          this.state = 477;
          this.expr(13);
          break;

        case 3:
          localctx = new NotExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 478;
          this.match(sequenceParser.NOT);
          this.state = 479;
          this.expr(12);
          break;

        case 4:
          localctx = new FuncExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 483;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 69, this._ctx);
          if (la_ === 1) {
            this.state = 480;
            this.to();
            this.state = 481;
            this.match(sequenceParser.DOT);
          }
          this.state = 485;
          this.func();
          break;

        case 5:
          localctx = new CreationExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 486;
          this.creation();
          break;

        case 6:
          localctx = new ParenthesizedExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 487;
          this.match(sequenceParser.OPAR);
          this.state = 488;
          this.expr(0);
          this.state = 489;
          this.match(sequenceParser.CPAR);
          break;

        case 7:
          localctx = new AssignmentExprContext(this, localctx);
          this._ctx = localctx;
          _prevctx = localctx;
          this.state = 491;
          this.assignment();
          this.state = 492;
          this.expr(1);
          break;
      }
      this._ctx.stop = this._input.LT(-1);
      this.state = 519;
      this._errHandler.sync(this);
      var _alt = this._interp.adaptivePredict(this._input, 72, this._ctx);
      while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
        if (_alt === 1) {
          if (this._parseListeners !== null) {
            this.triggerExitRuleEvent();
          }
          _prevctx = localctx;
          this.state = 517;
          this._errHandler.sync(this);
          var la_ = this._interp.adaptivePredict(this._input, 71, this._ctx);
          switch (la_) {
            case 1:
              localctx = new MultiplicationExprContext(
                this,
                new ExprContext(this, _parentctx, _parentState)
              );
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 496;
              if (!this.precpred(this._ctx, 11)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 11)'
                );
              }
              this.state = 497;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!((_la & ~0x1f) == 0 && ((1 << _la) & 29360128) !== 0)) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 498;
              this.expr(12);
              break;

            case 2:
              localctx = new AdditiveExprContext(
                this,
                new ExprContext(this, _parentctx, _parentState)
              );
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 499;
              if (!this.precpred(this._ctx, 10)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 10)'
                );
              }
              this.state = 500;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!(_la === 20 || _la === 21)) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 501;
              this.expr(11);
              break;

            case 3:
              localctx = new RelationalExprContext(
                this,
                new ExprContext(this, _parentctx, _parentState)
              );
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 502;
              if (!this.precpred(this._ctx, 9)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 9)'
                );
              }
              this.state = 503;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!((_la & ~0x1f) == 0 && ((1 << _la) & 983040) !== 0)) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 504;
              this.expr(10);
              break;

            case 4:
              localctx = new EqualityExprContext(
                this,
                new ExprContext(this, _parentctx, _parentState)
              );
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 505;
              if (!this.precpred(this._ctx, 8)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 8)'
                );
              }
              this.state = 506;
              localctx.op = this._input.LT(1);
              _la = this._input.LA(1);
              if (!(_la === 14 || _la === 15)) {
                localctx.op = this._errHandler.recoverInline(this);
              } else {
                this._errHandler.reportMatch(this);
                this.consume();
              }
              this.state = 507;
              this.expr(9);
              break;

            case 5:
              localctx = new AndExprContext(this, new ExprContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 508;
              if (!this.precpred(this._ctx, 7)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 7)'
                );
              }
              this.state = 509;
              this.match(sequenceParser.AND);
              this.state = 510;
              this.expr(8);
              break;

            case 6:
              localctx = new OrExprContext(this, new ExprContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 511;
              if (!this.precpred(this._ctx, 6)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 6)'
                );
              }
              this.state = 512;
              this.match(sequenceParser.OR);
              this.state = 513;
              this.expr(7);
              break;

            case 7:
              localctx = new PlusExprContext(this, new ExprContext(this, _parentctx, _parentState));
              this.pushNewRecursionContext(localctx, _startState, sequenceParser.RULE_expr);
              this.state = 514;
              if (!this.precpred(this._ctx, 5)) {
                throw new antlr4.error.FailedPredicateException(
                  this,
                  'this.precpred(this._ctx, 5)'
                );
              }
              this.state = 515;
              this.match(sequenceParser.PLUS);
              this.state = 516;
              this.expr(6);
              break;
          }
        }
        this.state = 521;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 72, this._ctx);
      }
    } catch (error) {
      if (error instanceof antlr4.error.RecognitionException) {
        localctx.exception = error;
        this._errHandler.reportError(this, error);
        this._errHandler.recover(this, error);
      } else {
        throw error;
      }
    } finally {
      this.unrollRecursionContexts(_parentctx);
    }
    return localctx;
  }

  atom() {
    let localctx = new AtomContext(this, this._ctx, this.state);
    this.enterRule(localctx, 98, sequenceParser.RULE_atom);
    var _la = 0; // Token type
    try {
      this.state = 527;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 55:
        case 56:
          localctx = new NumberAtomContext(this, localctx);
          this.enterOuterAlt(localctx, 1);
          this.state = 522;
          _la = this._input.LA(1);
          if (!(_la === 55 || _la === 56)) {
            this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
          break;
        case 34:
        case 35:
          localctx = new BooleanAtomContext(this, localctx);
          this.enterOuterAlt(localctx, 2);
          this.state = 523;
          _la = this._input.LA(1);
          if (!(_la === 34 || _la === 35)) {
            this._errHandler.recoverInline(this);
          } else {
            this._errHandler.reportMatch(this);
            this.consume();
          }
          break;
        case 54:
          localctx = new IdAtomContext(this, localctx);
          this.enterOuterAlt(localctx, 3);
          this.state = 524;
          this.match(sequenceParser.ID);
          break;
        case 57:
          localctx = new StringAtomContext(this, localctx);
          this.enterOuterAlt(localctx, 4);
          this.state = 525;
          this.match(sequenceParser.STRING);
          break;
        case 36:
          localctx = new NilAtomContext(this, localctx);
          this.enterOuterAlt(localctx, 5);
          this.state = 526;
          this.match(sequenceParser.NIL);
          break;
        default:
          throw new antlr4.error.NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  parExpr() {
    let localctx = new ParExprContext(this, this._ctx, this.state);
    this.enterRule(localctx, 100, sequenceParser.RULE_parExpr);
    try {
      this.state = 538;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 74, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 529;
          this.match(sequenceParser.OPAR);
          this.state = 530;
          this.condition();
          this.state = 531;
          this.match(sequenceParser.CPAR);
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 533;
          this.match(sequenceParser.OPAR);
          this.state = 534;
          this.condition();
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 535;
          this.match(sequenceParser.OPAR);
          this.state = 536;
          this.match(sequenceParser.CPAR);
          break;

        case 4:
          this.enterOuterAlt(localctx, 4);
          this.state = 537;
          this.match(sequenceParser.OPAR);
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  condition() {
    let localctx = new ConditionContext(this, this._ctx, this.state);
    this.enterRule(localctx, 102, sequenceParser.RULE_condition);
    try {
      this.state = 543;
      this._errHandler.sync(this);
      var la_ = this._interp.adaptivePredict(this._input, 75, this._ctx);
      switch (la_) {
        case 1:
          this.enterOuterAlt(localctx, 1);
          this.state = 540;
          this.atom();
          break;

        case 2:
          this.enterOuterAlt(localctx, 2);
          this.state = 541;
          this.expr(0);
          break;

        case 3:
          this.enterOuterAlt(localctx, 3);
          this.state = 542;
          this.inExpr();
          break;
      }
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  inExpr() {
    let localctx = new InExprContext(this, this._ctx, this.state);
    this.enterRule(localctx, 104, sequenceParser.RULE_inExpr);
    try {
      this.enterOuterAlt(localctx, 1);
      this.state = 545;
      this.match(sequenceParser.ID);
      this.state = 546;
      this.match(sequenceParser.IN);
      this.state = 547;
      this.match(sequenceParser.ID);
    } catch (re) {
      if (re instanceof antlr4.error.RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
}

sequenceParser.EOF = antlr4.Token.EOF;
sequenceParser.WS = 1;
sequenceParser.CONSTANT = 2;
sequenceParser.READONLY = 3;
sequenceParser.STATIC = 4;
sequenceParser.AWAIT = 5;
sequenceParser.TITLE = 6;
sequenceParser.COL = 7;
sequenceParser.SOPEN = 8;
sequenceParser.SCLOSE = 9;
sequenceParser.ARROW = 10;
sequenceParser.COLOR = 11;
sequenceParser.OR = 12;
sequenceParser.AND = 13;
sequenceParser.EQ = 14;
sequenceParser.NEQ = 15;
sequenceParser.GT = 16;
sequenceParser.LT = 17;
sequenceParser.GTEQ = 18;
sequenceParser.LTEQ = 19;
sequenceParser.PLUS = 20;
sequenceParser.MINUS = 21;
sequenceParser.MULT = 22;
sequenceParser.DIV = 23;
sequenceParser.MOD = 24;
sequenceParser.POW = 25;
sequenceParser.NOT = 26;
sequenceParser.SCOL = 27;
sequenceParser.COMMA = 28;
sequenceParser.ASSIGN = 29;
sequenceParser.OPAR = 30;
sequenceParser.CPAR = 31;
sequenceParser.OBRACE = 32;
sequenceParser.CBRACE = 33;
sequenceParser.TRUE = 34;
sequenceParser.FALSE = 35;
sequenceParser.NIL = 36;
sequenceParser.IF = 37;
sequenceParser.ELSE = 38;
sequenceParser.WHILE = 39;
sequenceParser.RETURN = 40;
sequenceParser.NEW = 41;
sequenceParser.PAR = 42;
sequenceParser.GROUP = 43;
sequenceParser.OPT = 44;
sequenceParser.AS = 45;
sequenceParser.TRY = 46;
sequenceParser.CATCH = 47;
sequenceParser.FINALLY = 48;
sequenceParser.IN = 49;
sequenceParser.STARTER_LXR = 50;
sequenceParser.ANNOTATION_RET = 51;
sequenceParser.ANNOTATION = 52;
sequenceParser.DOT = 53;
sequenceParser.ID = 54;
sequenceParser.INT = 55;
sequenceParser.FLOAT = 56;
sequenceParser.STRING = 57;
sequenceParser.CR = 58;
sequenceParser.COMMENT = 59;
sequenceParser.OTHER = 60;
sequenceParser.DIVIDER = 61;
sequenceParser.EVENT_PAYLOAD_LXR = 62;
sequenceParser.EVENT_END = 63;
sequenceParser.TITLE_CONTENT = 64;
sequenceParser.TITLE_END = 65;

sequenceParser.RULE_prog = 0;
sequenceParser.RULE_title = 1;
sequenceParser.RULE_head = 2;
sequenceParser.RULE_group = 3;
sequenceParser.RULE_starterExp = 4;
sequenceParser.RULE_starter = 5;
sequenceParser.RULE_participant = 6;
sequenceParser.RULE_stereotype = 7;
sequenceParser.RULE_label = 8;
sequenceParser.RULE_participantType = 9;
sequenceParser.RULE_name = 10;
sequenceParser.RULE_width = 11;
sequenceParser.RULE_block = 12;
sequenceParser.RULE_ret = 13;
sequenceParser.RULE_divider = 14;
sequenceParser.RULE_dividerNote = 15;
sequenceParser.RULE_stat = 16;
sequenceParser.RULE_par = 17;
sequenceParser.RULE_opt = 18;
sequenceParser.RULE_creation = 19;
sequenceParser.RULE_creationBody = 20;
sequenceParser.RULE_message = 21;
sequenceParser.RULE_messageBody = 22;
sequenceParser.RULE_func = 23;
sequenceParser.RULE_from = 24;
sequenceParser.RULE_to = 25;
sequenceParser.RULE_signature = 26;
sequenceParser.RULE_invocation = 27;
sequenceParser.RULE_assignment = 28;
sequenceParser.RULE_asyncMessage = 29;
sequenceParser.RULE_content = 30;
sequenceParser.RULE_construct = 31;
sequenceParser.RULE_type = 32;
sequenceParser.RULE_assignee = 33;
sequenceParser.RULE_methodName = 34;
sequenceParser.RULE_parameters = 35;
sequenceParser.RULE_parameter = 36;
sequenceParser.RULE_declaration = 37;
sequenceParser.RULE_tcf = 38;
sequenceParser.RULE_tryBlock = 39;
sequenceParser.RULE_catchBlock = 40;
sequenceParser.RULE_finallyBlock = 41;
sequenceParser.RULE_alt = 42;
sequenceParser.RULE_ifBlock = 43;
sequenceParser.RULE_elseIfBlock = 44;
sequenceParser.RULE_elseBlock = 45;
sequenceParser.RULE_braceBlock = 46;
sequenceParser.RULE_loop = 47;
sequenceParser.RULE_expr = 48;
sequenceParser.RULE_atom = 49;
sequenceParser.RULE_parExpr = 50;
sequenceParser.RULE_condition = 51;
sequenceParser.RULE_inExpr = 52;

class ProgContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_prog;
  }

  EOF() {
    return this.getToken(sequenceParser.EOF, 0);
  }

  title() {
    return this.getTypedRuleContext(TitleContext, 0);
  }

  head() {
    return this.getTypedRuleContext(HeadContext, 0);
  }

  block() {
    return this.getTypedRuleContext(BlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterProg(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitProg(this);
    }
  }
}

class TitleContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_title;
  }

  TITLE() {
    return this.getToken(sequenceParser.TITLE, 0);
  }

  TITLE_CONTENT() {
    return this.getToken(sequenceParser.TITLE_CONTENT, 0);
  }

  TITLE_END() {
    return this.getToken(sequenceParser.TITLE_END, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterTitle(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitTitle(this);
    }
  }
}

class HeadContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_head;
  }

  group = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(GroupContext);
    } else {
      return this.getTypedRuleContext(GroupContext, i);
    }
  };

  participant = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ParticipantContext);
    } else {
      return this.getTypedRuleContext(ParticipantContext, i);
    }
  };

  starterExp() {
    return this.getTypedRuleContext(StarterExpContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterHead(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitHead(this);
    }
  }
}

class GroupContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_group;
  }

  GROUP() {
    return this.getToken(sequenceParser.GROUP, 0);
  }

  OBRACE() {
    return this.getToken(sequenceParser.OBRACE, 0);
  }

  CBRACE() {
    return this.getToken(sequenceParser.CBRACE, 0);
  }

  name() {
    return this.getTypedRuleContext(NameContext, 0);
  }

  participant = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ParticipantContext);
    } else {
      return this.getTypedRuleContext(ParticipantContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterGroup(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitGroup(this);
    }
  }
}

class StarterExpContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_starterExp;
  }

  STARTER_LXR() {
    return this.getToken(sequenceParser.STARTER_LXR, 0);
  }

  OPAR() {
    return this.getToken(sequenceParser.OPAR, 0);
  }

  CPAR() {
    return this.getToken(sequenceParser.CPAR, 0);
  }

  starter() {
    return this.getTypedRuleContext(StarterContext, 0);
  }

  ANNOTATION() {
    return this.getToken(sequenceParser.ANNOTATION, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterStarterExp(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitStarterExp(this);
    }
  }
}

class StarterContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_starter;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterStarter(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitStarter(this);
    }
  }
}

class ParticipantContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_participant;
  }

  name() {
    return this.getTypedRuleContext(NameContext, 0);
  }

  participantType() {
    return this.getTypedRuleContext(ParticipantTypeContext, 0);
  }

  stereotype() {
    return this.getTypedRuleContext(StereotypeContext, 0);
  }

  width() {
    return this.getTypedRuleContext(WidthContext, 0);
  }

  label() {
    return this.getTypedRuleContext(LabelContext, 0);
  }

  COLOR() {
    return this.getToken(sequenceParser.COLOR, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterParticipant(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitParticipant(this);
    }
  }
}

class StereotypeContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_stereotype;
  }

  SOPEN() {
    return this.getToken(sequenceParser.SOPEN, 0);
  }

  name() {
    return this.getTypedRuleContext(NameContext, 0);
  }

  SCLOSE() {
    return this.getToken(sequenceParser.SCLOSE, 0);
  }

  GT() {
    return this.getToken(sequenceParser.GT, 0);
  }

  LT() {
    return this.getToken(sequenceParser.LT, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterStereotype(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitStereotype(this);
    }
  }
}

class LabelContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_label;
  }

  AS() {
    return this.getToken(sequenceParser.AS, 0);
  }

  name() {
    return this.getTypedRuleContext(NameContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterLabel(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitLabel(this);
    }
  }
}

class ParticipantTypeContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_participantType;
  }

  ANNOTATION() {
    return this.getToken(sequenceParser.ANNOTATION, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterParticipantType(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitParticipantType(this);
    }
  }
}

class NameContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_name;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterName(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitName(this);
    }
  }
}

class WidthContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_width;
  }

  INT() {
    return this.getToken(sequenceParser.INT, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterWidth(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitWidth(this);
    }
  }
}

class BlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_block;
  }

  stat = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(StatContext);
    } else {
      return this.getTypedRuleContext(StatContext, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitBlock(this);
    }
  }
}

class RetContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_ret;
  }

  RETURN() {
    return this.getToken(sequenceParser.RETURN, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  SCOL() {
    return this.getToken(sequenceParser.SCOL, 0);
  }

  ANNOTATION_RET() {
    return this.getToken(sequenceParser.ANNOTATION_RET, 0);
  }

  asyncMessage() {
    return this.getTypedRuleContext(AsyncMessageContext, 0);
  }

  EVENT_END() {
    return this.getToken(sequenceParser.EVENT_END, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterRet(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitRet(this);
    }
  }
}

class DividerContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_divider;
  }

  dividerNote() {
    return this.getTypedRuleContext(DividerNoteContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterDivider(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitDivider(this);
    }
  }
}

class DividerNoteContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_dividerNote;
  }

  DIVIDER() {
    return this.getToken(sequenceParser.DIVIDER, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterDividerNote(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitDividerNote(this);
    }
  }
}

class StatContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_stat;
    this._OTHER = null; // Token
  }

  alt() {
    return this.getTypedRuleContext(AltContext, 0);
  }

  par() {
    return this.getTypedRuleContext(ParContext, 0);
  }

  opt() {
    return this.getTypedRuleContext(OptContext, 0);
  }

  loop() {
    return this.getTypedRuleContext(LoopContext, 0);
  }

  creation() {
    return this.getTypedRuleContext(CreationContext, 0);
  }

  message() {
    return this.getTypedRuleContext(MessageContext, 0);
  }

  asyncMessage() {
    return this.getTypedRuleContext(AsyncMessageContext, 0);
  }

  EVENT_END() {
    return this.getToken(sequenceParser.EVENT_END, 0);
  }

  ret() {
    return this.getTypedRuleContext(RetContext, 0);
  }

  divider() {
    return this.getTypedRuleContext(DividerContext, 0);
  }

  tcf() {
    return this.getTypedRuleContext(TcfContext, 0);
  }

  OTHER() {
    return this.getToken(sequenceParser.OTHER, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterStat(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitStat(this);
    }
  }
}

class ParContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_par;
  }

  PAR() {
    return this.getToken(sequenceParser.PAR, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterPar(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitPar(this);
    }
  }
}

class OptContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_opt;
  }

  OPT() {
    return this.getToken(sequenceParser.OPT, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterOpt(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitOpt(this);
    }
  }
}

class CreationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_creation;
  }

  creationBody() {
    return this.getTypedRuleContext(CreationBodyContext, 0);
  }

  SCOL() {
    return this.getToken(sequenceParser.SCOL, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterCreation(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitCreation(this);
    }
  }
}

class CreationBodyContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_creationBody;
  }

  NEW() {
    return this.getToken(sequenceParser.NEW, 0);
  }

  construct() {
    return this.getTypedRuleContext(ConstructContext, 0);
  }

  assignment() {
    return this.getTypedRuleContext(AssignmentContext, 0);
  }

  OPAR() {
    return this.getToken(sequenceParser.OPAR, 0);
  }

  CPAR() {
    return this.getToken(sequenceParser.CPAR, 0);
  }

  parameters() {
    return this.getTypedRuleContext(ParametersContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterCreationBody(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitCreationBody(this);
    }
  }
}

class MessageContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_message;
  }

  messageBody() {
    return this.getTypedRuleContext(MessageBodyContext, 0);
  }

  SCOL() {
    return this.getToken(sequenceParser.SCOL, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterMessage(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitMessage(this);
    }
  }
}

class MessageBodyContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_messageBody;
  }

  func() {
    return this.getTypedRuleContext(FuncContext, 0);
  }

  assignment() {
    return this.getTypedRuleContext(AssignmentContext, 0);
  }

  to() {
    return this.getTypedRuleContext(ToContext, 0);
  }

  DOT() {
    return this.getToken(sequenceParser.DOT, 0);
  }

  from() {
    return this.getTypedRuleContext(FromContext, 0);
  }

  ARROW() {
    return this.getToken(sequenceParser.ARROW, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterMessageBody(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitMessageBody(this);
    }
  }
}

class FuncContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_func;
  }

  signature = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(SignatureContext);
    } else {
      return this.getTypedRuleContext(SignatureContext, i);
    }
  };

  DOT = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(sequenceParser.DOT);
    } else {
      return this.getToken(sequenceParser.DOT, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterFunc(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitFunc(this);
    }
  }
}

class FromContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_from;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterFrom(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitFrom(this);
    }
  }
}

class ToContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_to;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterTo(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitTo(this);
    }
  }
}

class SignatureContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_signature;
  }

  methodName() {
    return this.getTypedRuleContext(MethodNameContext, 0);
  }

  invocation() {
    return this.getTypedRuleContext(InvocationContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterSignature(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitSignature(this);
    }
  }
}

class InvocationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_invocation;
  }

  OPAR() {
    return this.getToken(sequenceParser.OPAR, 0);
  }

  CPAR() {
    return this.getToken(sequenceParser.CPAR, 0);
  }

  parameters() {
    return this.getTypedRuleContext(ParametersContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterInvocation(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitInvocation(this);
    }
  }
}

class AssignmentContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_assignment;
  }

  assignee() {
    return this.getTypedRuleContext(AssigneeContext, 0);
  }

  ASSIGN() {
    return this.getToken(sequenceParser.ASSIGN, 0);
  }

  type() {
    return this.getTypedRuleContext(TypeContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAssignment(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAssignment(this);
    }
  }
}

class AsyncMessageContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_asyncMessage;
  }

  to() {
    return this.getTypedRuleContext(ToContext, 0);
  }

  COL() {
    return this.getToken(sequenceParser.COL, 0);
  }

  content() {
    return this.getTypedRuleContext(ContentContext, 0);
  }

  from() {
    return this.getTypedRuleContext(FromContext, 0);
  }

  ARROW() {
    return this.getToken(sequenceParser.ARROW, 0);
  }

  MINUS() {
    return this.getToken(sequenceParser.MINUS, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAsyncMessage(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAsyncMessage(this);
    }
  }
}

class ContentContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_content;
  }

  EVENT_PAYLOAD_LXR() {
    return this.getToken(sequenceParser.EVENT_PAYLOAD_LXR, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterContent(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitContent(this);
    }
  }
}

class ConstructContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_construct;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterConstruct(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitConstruct(this);
    }
  }
}

class TypeContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_type;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterType(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitType(this);
    }
  }
}

class AssigneeContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_assignee;
  }

  atom() {
    return this.getTypedRuleContext(AtomContext, 0);
  }

  ID = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(sequenceParser.ID);
    } else {
      return this.getToken(sequenceParser.ID, i);
    }
  };

  COMMA = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(sequenceParser.COMMA);
    } else {
      return this.getToken(sequenceParser.COMMA, i);
    }
  };

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAssignee(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAssignee(this);
    }
  }
}

class MethodNameContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_methodName;
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterMethodName(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitMethodName(this);
    }
  }
}

class ParametersContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_parameters;
  }

  parameter = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ParameterContext);
    } else {
      return this.getTypedRuleContext(ParameterContext, i);
    }
  };

  COMMA = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(sequenceParser.COMMA);
    } else {
      return this.getToken(sequenceParser.COMMA, i);
    }
  };

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterParameters(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitParameters(this);
    }
  }
}

class ParameterContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_parameter;
  }

  declaration() {
    return this.getTypedRuleContext(DeclarationContext, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterParameter(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitParameter(this);
    }
  }
}

class DeclarationContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_declaration;
  }

  type() {
    return this.getTypedRuleContext(TypeContext, 0);
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterDeclaration(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitDeclaration(this);
    }
  }
}

class TcfContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_tcf;
  }

  tryBlock() {
    return this.getTypedRuleContext(TryBlockContext, 0);
  }

  catchBlock = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(CatchBlockContext);
    } else {
      return this.getTypedRuleContext(CatchBlockContext, i);
    }
  };

  finallyBlock() {
    return this.getTypedRuleContext(FinallyBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterTcf(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitTcf(this);
    }
  }
}

class TryBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_tryBlock;
  }

  TRY() {
    return this.getToken(sequenceParser.TRY, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterTryBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitTryBlock(this);
    }
  }
}

class CatchBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_catchBlock;
  }

  CATCH() {
    return this.getToken(sequenceParser.CATCH, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  invocation() {
    return this.getTypedRuleContext(InvocationContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterCatchBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitCatchBlock(this);
    }
  }
}

class FinallyBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_finallyBlock;
  }

  FINALLY() {
    return this.getToken(sequenceParser.FINALLY, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterFinallyBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitFinallyBlock(this);
    }
  }
}

class AltContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_alt;
  }

  ifBlock() {
    return this.getTypedRuleContext(IfBlockContext, 0);
  }

  elseIfBlock = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ElseIfBlockContext);
    } else {
      return this.getTypedRuleContext(ElseIfBlockContext, i);
    }
  };

  elseBlock() {
    return this.getTypedRuleContext(ElseBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAlt(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAlt(this);
    }
  }
}

class IfBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_ifBlock;
  }

  IF() {
    return this.getToken(sequenceParser.IF, 0);
  }

  parExpr() {
    return this.getTypedRuleContext(ParExprContext, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterIfBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitIfBlock(this);
    }
  }
}

class ElseIfBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_elseIfBlock;
  }

  ELSE() {
    return this.getToken(sequenceParser.ELSE, 0);
  }

  IF() {
    return this.getToken(sequenceParser.IF, 0);
  }

  parExpr() {
    return this.getTypedRuleContext(ParExprContext, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterElseIfBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitElseIfBlock(this);
    }
  }
}

class ElseBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_elseBlock;
  }

  ELSE() {
    return this.getToken(sequenceParser.ELSE, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterElseBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitElseBlock(this);
    }
  }
}

class BraceBlockContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_braceBlock;
  }

  OBRACE() {
    return this.getToken(sequenceParser.OBRACE, 0);
  }

  CBRACE() {
    return this.getToken(sequenceParser.CBRACE, 0);
  }

  block() {
    return this.getTypedRuleContext(BlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterBraceBlock(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitBraceBlock(this);
    }
  }
}

class LoopContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_loop;
  }

  WHILE() {
    return this.getToken(sequenceParser.WHILE, 0);
  }

  parExpr() {
    return this.getTypedRuleContext(ParExprContext, 0);
  }

  braceBlock() {
    return this.getTypedRuleContext(BraceBlockContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterLoop(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitLoop(this);
    }
  }
}

class ExprContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_expr;
  }

  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}

class AssignmentExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  assignment() {
    return this.getTypedRuleContext(AssignmentContext, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAssignmentExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAssignmentExpr(this);
    }
  }
}

sequenceParser.AssignmentExprContext = AssignmentExprContext;

class FuncExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  func() {
    return this.getTypedRuleContext(FuncContext, 0);
  }

  to() {
    return this.getTypedRuleContext(ToContext, 0);
  }

  DOT() {
    return this.getToken(sequenceParser.DOT, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterFuncExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitFuncExpr(this);
    }
  }
}

sequenceParser.FuncExprContext = FuncExprContext;

class AtomExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  atom() {
    return this.getTypedRuleContext(AtomContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAtomExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAtomExpr(this);
    }
  }
}

sequenceParser.AtomExprContext = AtomExprContext;

class OrExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  OR() {
    return this.getToken(sequenceParser.OR, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterOrExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitOrExpr(this);
    }
  }
}

sequenceParser.OrExprContext = OrExprContext;

class AdditiveExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null; // Token;
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  PLUS() {
    return this.getToken(sequenceParser.PLUS, 0);
  }

  MINUS() {
    return this.getToken(sequenceParser.MINUS, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAdditiveExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAdditiveExpr(this);
    }
  }
}

sequenceParser.AdditiveExprContext = AdditiveExprContext;

class RelationalExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null; // Token;
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  LTEQ() {
    return this.getToken(sequenceParser.LTEQ, 0);
  }

  GTEQ() {
    return this.getToken(sequenceParser.GTEQ, 0);
  }

  LT() {
    return this.getToken(sequenceParser.LT, 0);
  }

  GT() {
    return this.getToken(sequenceParser.GT, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterRelationalExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitRelationalExpr(this);
    }
  }
}

sequenceParser.RelationalExprContext = RelationalExprContext;

class PlusExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  PLUS() {
    return this.getToken(sequenceParser.PLUS, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterPlusExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitPlusExpr(this);
    }
  }
}

sequenceParser.PlusExprContext = PlusExprContext;

class NotExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  NOT() {
    return this.getToken(sequenceParser.NOT, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterNotExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitNotExpr(this);
    }
  }
}

sequenceParser.NotExprContext = NotExprContext;

class UnaryMinusExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  MINUS() {
    return this.getToken(sequenceParser.MINUS, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterUnaryMinusExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitUnaryMinusExpr(this);
    }
  }
}

sequenceParser.UnaryMinusExprContext = UnaryMinusExprContext;

class CreationExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  creation() {
    return this.getTypedRuleContext(CreationContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterCreationExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitCreationExpr(this);
    }
  }
}

sequenceParser.CreationExprContext = CreationExprContext;

class ParenthesizedExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  OPAR() {
    return this.getToken(sequenceParser.OPAR, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  CPAR() {
    return this.getToken(sequenceParser.CPAR, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterParenthesizedExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitParenthesizedExpr(this);
    }
  }
}

sequenceParser.ParenthesizedExprContext = ParenthesizedExprContext;

class MultiplicationExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null; // Token;
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  MULT() {
    return this.getToken(sequenceParser.MULT, 0);
  }

  DIV() {
    return this.getToken(sequenceParser.DIV, 0);
  }

  MOD() {
    return this.getToken(sequenceParser.MOD, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterMultiplicationExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitMultiplicationExpr(this);
    }
  }
}

sequenceParser.MultiplicationExprContext = MultiplicationExprContext;

class EqualityExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    this.op = null; // Token;
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  EQ() {
    return this.getToken(sequenceParser.EQ, 0);
  }

  NEQ() {
    return this.getToken(sequenceParser.NEQ, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterEqualityExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitEqualityExpr(this);
    }
  }
}

sequenceParser.EqualityExprContext = EqualityExprContext;

class AndExprContext extends ExprContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  expr = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTypedRuleContexts(ExprContext);
    } else {
      return this.getTypedRuleContext(ExprContext, i);
    }
  };

  AND() {
    return this.getToken(sequenceParser.AND, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterAndExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitAndExpr(this);
    }
  }
}

sequenceParser.AndExprContext = AndExprContext;

class AtomContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_atom;
  }

  copyFrom(ctx) {
    super.copyFrom(ctx);
  }
}

class BooleanAtomContext extends AtomContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  TRUE() {
    return this.getToken(sequenceParser.TRUE, 0);
  }

  FALSE() {
    return this.getToken(sequenceParser.FALSE, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterBooleanAtom(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitBooleanAtom(this);
    }
  }
}

sequenceParser.BooleanAtomContext = BooleanAtomContext;

class IdAtomContext extends AtomContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  ID() {
    return this.getToken(sequenceParser.ID, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterIdAtom(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitIdAtom(this);
    }
  }
}

sequenceParser.IdAtomContext = IdAtomContext;

class StringAtomContext extends AtomContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  STRING() {
    return this.getToken(sequenceParser.STRING, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterStringAtom(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitStringAtom(this);
    }
  }
}

sequenceParser.StringAtomContext = StringAtomContext;

class NilAtomContext extends AtomContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  NIL() {
    return this.getToken(sequenceParser.NIL, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterNilAtom(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitNilAtom(this);
    }
  }
}

sequenceParser.NilAtomContext = NilAtomContext;

class NumberAtomContext extends AtomContext {
  constructor(parser, ctx) {
    super(parser);
    super.copyFrom(ctx);
  }

  INT() {
    return this.getToken(sequenceParser.INT, 0);
  }

  FLOAT() {
    return this.getToken(sequenceParser.FLOAT, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterNumberAtom(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitNumberAtom(this);
    }
  }
}

sequenceParser.NumberAtomContext = NumberAtomContext;

class ParExprContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_parExpr;
  }

  OPAR() {
    return this.getToken(sequenceParser.OPAR, 0);
  }

  condition() {
    return this.getTypedRuleContext(ConditionContext, 0);
  }

  CPAR() {
    return this.getToken(sequenceParser.CPAR, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterParExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitParExpr(this);
    }
  }
}

class ConditionContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_condition;
  }

  atom() {
    return this.getTypedRuleContext(AtomContext, 0);
  }

  expr() {
    return this.getTypedRuleContext(ExprContext, 0);
  }

  inExpr() {
    return this.getTypedRuleContext(InExprContext, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterCondition(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitCondition(this);
    }
  }
}

class InExprContext extends antlr4.ParserRuleContext {
  constructor(parser, parent, invokingState) {
    if (parent === undefined) {
      parent = null;
    }
    if (invokingState === undefined || invokingState === null) {
      invokingState = -1;
    }
    super(parent, invokingState);
    this.parser = parser;
    this.ruleIndex = sequenceParser.RULE_inExpr;
  }

  ID = function (i) {
    if (i === undefined) {
      i = null;
    }
    if (i === null) {
      return this.getTokens(sequenceParser.ID);
    } else {
      return this.getToken(sequenceParser.ID, i);
    }
  };

  IN() {
    return this.getToken(sequenceParser.IN, 0);
  }

  enterRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.enterInExpr(this);
    }
  }

  exitRule(listener) {
    if (listener instanceof sequenceParserListener) {
      listener.exitInExpr(this);
    }
  }
}

sequenceParser.ProgContext = ProgContext;
sequenceParser.TitleContext = TitleContext;
sequenceParser.HeadContext = HeadContext;
sequenceParser.GroupContext = GroupContext;
sequenceParser.StarterExpContext = StarterExpContext;
sequenceParser.StarterContext = StarterContext;
sequenceParser.ParticipantContext = ParticipantContext;
sequenceParser.StereotypeContext = StereotypeContext;
sequenceParser.LabelContext = LabelContext;
sequenceParser.ParticipantTypeContext = ParticipantTypeContext;
sequenceParser.NameContext = NameContext;
sequenceParser.WidthContext = WidthContext;
sequenceParser.BlockContext = BlockContext;
sequenceParser.RetContext = RetContext;
sequenceParser.DividerContext = DividerContext;
sequenceParser.DividerNoteContext = DividerNoteContext;
sequenceParser.StatContext = StatContext;
sequenceParser.ParContext = ParContext;
sequenceParser.OptContext = OptContext;
sequenceParser.CreationContext = CreationContext;
sequenceParser.CreationBodyContext = CreationBodyContext;
sequenceParser.MessageContext = MessageContext;
sequenceParser.MessageBodyContext = MessageBodyContext;
sequenceParser.FuncContext = FuncContext;
sequenceParser.FromContext = FromContext;
sequenceParser.ToContext = ToContext;
sequenceParser.SignatureContext = SignatureContext;
sequenceParser.InvocationContext = InvocationContext;
sequenceParser.AssignmentContext = AssignmentContext;
sequenceParser.AsyncMessageContext = AsyncMessageContext;
sequenceParser.ContentContext = ContentContext;
sequenceParser.ConstructContext = ConstructContext;
sequenceParser.TypeContext = TypeContext;
sequenceParser.AssigneeContext = AssigneeContext;
sequenceParser.MethodNameContext = MethodNameContext;
sequenceParser.ParametersContext = ParametersContext;
sequenceParser.ParameterContext = ParameterContext;
sequenceParser.DeclarationContext = DeclarationContext;
sequenceParser.TcfContext = TcfContext;
sequenceParser.TryBlockContext = TryBlockContext;
sequenceParser.CatchBlockContext = CatchBlockContext;
sequenceParser.FinallyBlockContext = FinallyBlockContext;
sequenceParser.AltContext = AltContext;
sequenceParser.IfBlockContext = IfBlockContext;
sequenceParser.ElseIfBlockContext = ElseIfBlockContext;
sequenceParser.ElseBlockContext = ElseBlockContext;
sequenceParser.BraceBlockContext = BraceBlockContext;
sequenceParser.LoopContext = LoopContext;
sequenceParser.ExprContext = ExprContext;
sequenceParser.AtomContext = AtomContext;
sequenceParser.ParExprContext = ParExprContext;
sequenceParser.ConditionContext = ConditionContext;
sequenceParser.InExprContext = InExprContext;
