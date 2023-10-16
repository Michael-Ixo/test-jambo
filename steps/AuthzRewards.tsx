import { FC, useState, useEffect, useContext, ChangeEvent } from 'react';
import { cosmos, utils } from '@ixo/impactxclient-sdk';
import cls from 'classnames';

import utilsStyles from '@styles/utils.module.scss';
import styles from '@styles/stepsPages.module.scss';
import { ViewOnExplorerButton } from '@components/Button/Button';
import IconText from '@components/IconText/IconText';
import Header from '@components/Header/Header';
import Loader from '@components/Loader/Loader';
import Footer from '@components/Footer/Footer';
import Anchor from '@components/Anchor/Anchor';
import Success from '@icons/success.svg';
import {
  defaultTrxFeeOption,
  generateAuthzGrantTrx,
  generateAuthzRevokeTrx,
  generateGenericAuthorizationTrx,
} from '@utils/transactions';
import { broadCastMessages } from '@utils/wallets';
import { ReviewStepsTypes, StepConfigType, StepDataType, STEPS } from 'types/steps';
import { KEPLR_CHAIN_INFO_TYPE } from 'types/chain';
import { WalletContext } from '@contexts/wallet';
import { ChainContext } from '@contexts/chain';
import { queryAllowances, queryGrant } from '@utils/query';
import Input from '@components/Input/Input';
import SadFace from '@icons/sad_face.svg';
import { addDaysToDate } from '@utils/misc';

type AuthzRewardsProps = {
  onSuccess: (data: StepDataType<STEPS.review_and_sign>) => void;
  onBack?: () => void;
  // data?: StepDataType<STEPS.get_validator_delegate>;
  config?: StepConfigType<STEPS.auto_MsgWithdrawDelegatorReward>;
  header?: string;
  message: ReviewStepsTypes;
};

const AuthzRewards: FC<AuthzRewardsProps> = ({ onSuccess, onBack, config, header, message }) => {
  const [successHash, setSuccessHash] = useState<string | undefined>();
  const [authz, setAuthz] = useState<boolean | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expiration, setExpiration] = useState(addDaysToDate(new Date(), 365)?.toISOString().split('T')[0]);
  const { wallet } = useContext(WalletContext);
  const { chainInfo, queryClient } = useContext(ChainContext);

  useEffect(() => {
    if (queryClient) loadAuthz();
  }, [queryClient]);

  const loadAuthz = async (): Promise<void> => {
    try {
      const grants = await queryGrant(queryClient!, wallet?.user?.address!, config!.authzGrantee);
      const validGrants = grants.filter(
        (g) =>
          g.authorization?.typeUrl === '/cosmos.authz.v1beta1.GenericAuthorization' &&
          g.authorization?.value?.msg === '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward' &&
          (g?.expiration ?? Date.now() + 1000) > Date.now(),
      );
      if (validGrants.length) {
        setAuthz(true);
      } else {
        setAuthz(false);
      }
    } catch (error) {
      console.error(error);
      setAuthz(false);
      setError((error as { message: string }).message);
    } finally {
      setLoading(false);
    }
  };

  const signTX = async (): Promise<void> => {
    if (!expiration) return;
    setLoading(true);
    const trx = !authz
      ? generateAuthzGrantTrx({
          granter: wallet?.user?.address!,
          grantee: config?.authzGrantee!,
          grant: cosmos.authz.v1beta1.Grant.fromPartial({
            authorization: generateGenericAuthorizationTrx(
              {
                msg: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
              },
              true,
            ) as { typeUrl: string; value: Uint8Array },
            expiration: utils.proto.toTimestamp(new Date(expiration as unknown as Date)),
          }),
        })
      : generateAuthzRevokeTrx({
          granter: wallet?.user?.address!,
          grantee: config?.authzGrantee!,
          msgTypeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
        });
    const allowances = await queryAllowances(queryClient!, wallet.user!.address);
    const hash = await broadCastMessages(
      wallet,
      [trx],
      undefined,
      defaultTrxFeeOption,
      '',
      chainInfo as KEPLR_CHAIN_INFO_TYPE,
      allowances?.allowances[0]?.granter ?? undefined,
    );
    if (hash) setSuccessHash(hash);

    setLoading(false);
    loadAuthz();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log({ name, value });
    setExpiration(value);
  };

  if (successHash)
    return (
      <>
        <Header header={header} />

        <main className={cls(utilsStyles.main, utilsStyles.columnJustifyCenter, styles.stepContainer)}>
          <IconText title='Your transaction was successful!' Img={Success} imgSize={50}>
            {chainInfo?.txExplorer && (
              <Anchor active openInNewTab href={`${chainInfo.txExplorer.txUrl.replace(/\${txHash}/i, successHash)}`}>
                <ViewOnExplorerButton explorer={chainInfo.txExplorer.name} />
              </Anchor>
            )}
          </IconText>
        </main>

        <Footer showAccountButton={!!successHash} showActionsButton={!!successHash} />
      </>
    );

  return (
    <>
      <Header header={header} />

      <main className={cls(utilsStyles.main, utilsStyles.columnJustifyCenter, styles.stepContainer)}>
        {loading || authz === undefined ? (
          <Loader />
        ) : error ? (
          <IconText title={error} Img={SadFace} imgSize={50} />
        ) : authz ? (
          <form className={styles.stepsForm} autoComplete='none'>
            <p>Your stake rewards are automatically claimed on a daily basis.</p>
            <br />
            <p>Stop Auto Claiming?</p>
          </form>
        ) : (
          <form className={styles.stepsForm} autoComplete='none'>
            <p>Grant us authorization to claim your staking rewards for you on a daily basis?</p>
            <p>Expiration:</p>
            <div className={utilsStyles.columnAlignCenter}>
              <Input
                type='date'
                value={expiration}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                align='center'
              />
            </div>
          </form>
        )}

        <Footer
          onBack={loading || successHash ? null : onBack}
          onBackUrl={onBack ? undefined : ''}
          onCorrect={loading || !!successHash || !!error ? null : signTX}
          correctLabel={loading ? 'Authorizing' : !successHash ? 'Authorize' : undefined}
          showAccountButton={!!successHash}
          showActionsButton={!!successHash}
        />
      </main>
    </>
  );
};

export default AuthzRewards;
