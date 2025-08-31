import {MoneyBank} from 'workspace/piggy-bank/domain/model/MoneyBank'
import {RamBank} from 'workspace/piggy-bank/domain/model/RamBank'

export type Bank = {
    moneyBank: MoneyBank;
    ramBank: RamBank;
    // TODO : add timebank ?
    // TODO : add karmabank ? (useful pour faction)
}