/**
 * Gerenciador de transações para operações que precisam de atomicidade
 * Garante que múltiplas operações no banco de dados sejam executadas como uma única unidade
 */
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { db } from './db';
import { sql } from 'drizzle-orm';
/**
 * Executa uma função em uma transação
 * Se a função lançar uma exceção, a transação será revertida
 * Se a função for concluída com sucesso, a transação será confirmada
 * @param callback Função a ser executada dentro da transação
 * @returns O resultado da função de callback
 */
export function withTransaction(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_1, rollbackError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 9]);
                    // Iniciar a transação
                    return [4 /*yield*/, db.execute(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["BEGIN"], ["BEGIN"]))))];
                case 1:
                    // Iniciar a transação
                    _a.sent();
                    console.log('Transação iniciada');
                    return [4 /*yield*/, callback()];
                case 2:
                    result = _a.sent();
                    // Confirmar a transação se tudo correu bem
                    return [4 /*yield*/, db.execute(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["COMMIT"], ["COMMIT"]))))];
                case 3:
                    // Confirmar a transação se tudo correu bem
                    _a.sent();
                    console.log('Transação confirmada com sucesso');
                    return [2 /*return*/, result];
                case 4:
                    error_1 = _a.sent();
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, db.execute(sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["ROLLBACK"], ["ROLLBACK"]))))];
                case 6:
                    _a.sent();
                    console.log('Transação revertida devido a erro:', error_1);
                    return [3 /*break*/, 8];
                case 7:
                    rollbackError_1 = _a.sent();
                    console.error('Erro ao reverter transação:', rollbackError_1);
                    return [3 /*break*/, 8];
                case 8: 
                // Propagar o erro original
                throw error_1;
                case 9: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3;
