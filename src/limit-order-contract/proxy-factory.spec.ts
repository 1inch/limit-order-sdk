import {Address} from './../address.js'
import {ProxyFactoryFacade} from './proxy-factory-facade.js'

describe('ProxyFactoryFacade', () => {
    it('should correct calc proxy address for Ethereum', () => {
        const facade = new ProxyFactoryFacade(
            1,
            new Address('0x4bc5a9d205adf1091d596bc2e1aa0d6b9dc3b12c'),
            new Address('0xfbc2d33fc6c7fadb155974b847dc04f39010caa9')
        )
        const salt =
            '0x3fccfe0035a1010d48c1573e1fc78290082e778619ddb01429af83b5f3faf29c'

        const address = facade.getProxyAddress(salt)
        expect(address).toEqual(
            new Address('0x762bef5aa97185121b080f6cacb58901fe1e7751')
        )
    })

    it('should correct calc proxy address for zkSync', () => {
        const facade = new ProxyFactoryFacade(
            324,
            new Address('0x584aEaB186D81dbB52a8a14820c573480c3d4773'),
            new Address('0xddc60c7babfc55d8030f51910b157e179f7a41fc')
        )
        const salt =
            '0x7d1798e1fe1eef8c94c50886f476477781a4d56f4126ae8a3a88f5546649d153'

        const address = facade.getProxyAddress(salt)
        expect(address).toEqual(
            new Address('0x98f0a945348c031f85164562bff61eb08a0629df')
        )
    })
})
