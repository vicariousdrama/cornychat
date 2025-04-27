NODEALIAS=$1
c1=$(ls lnbits.macaroon.$NODEALIAS.bak 2>/dev/null | wc -l)
c2=$(ls tls.crt.$NODEALIAS.bak 2>/dev/null | wc -l)
if [ "$c1" != "1" ]
then
  echo "lnbits.macaroon.$NODEALIAS.bak is not present. exiting."
  exit 1
fi
if [ "$c2" != "1" ]
then
  echo "tls.crt.$NODEALIAS.bak is not present. exiting."
  exit 1
fi
printf "Continuing will replace...\n"
printf "   lnbits.macaroon   with   lnbits.macaroon.${NODEALIAS}.bak\n"
printf "   tls.crt           with   tls.crt.${NODEALIAS}.bak\n"
read -p "Press enter to continue"
cp lnbits.macaroon.$NODEALIAS.bak lnbits.macaroon
cp tls.crt.$NODEALIAS.bak tls.crt