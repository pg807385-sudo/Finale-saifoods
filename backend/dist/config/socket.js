"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.setIo = void 0;
let io;
const setIo = (instance) => {
    io = instance;
};
exports.setIo = setIo;
const getIo = () => io;
exports.getIo = getIo;
//# sourceMappingURL=socket.js.map