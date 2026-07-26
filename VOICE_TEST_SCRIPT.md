# Voice Accuracy Test — Lal Khata

Live app: https://lal-khata.vercel.app

Read each line naturally into the mic (don't over-enunciate — that's not how a
real shopkeeper talks). After each one, fill in what the confirmation card
actually showed under **Actual result**, and mark **Pass/Fail**. This becomes
the accuracy table for the Kaggle writeup's Impact & Validation section.

| # | Say (Bangla) | Meaning | Expected result | Actual result | Pass/Fail |
|---|---|---|---|---|---|
| 1 | রহিম ভাইকে ৫০ টাকার ডাল বাকি দিলাম | Gave Rahim bhai 50tk lentils on credit | credit_sale · রহিম ভাই · ডাল · ৳50 | | |
| 2 | একশো টাকার চাল বিক্রি | 100tk rice, cash sale | cash_sale · no customer · চাল · ৳100 | | |
| 3 | করিম ভাই পঞ্চাশ টাকা শোধ করলো | Karim bhai repaid 50tk | repayment · করিম ভাই · ৳50 | | |
| 4 | জামাল কে ৮০ taka চিনি বাকি | Jamal, 80tk sugar, credit (Banglish mix) | credit_sale · জামাল · চিনি · ৳80 | | |
| 5 | দুইশো টাকার তেল নগদ বিক্রি | 200tk oil, cash sale | cash_sale · no customer · তেল · ৳200 | | |
| 6 | সেলিম ভাই একশো টাকা জমা দিলো | Selim bhai deposited/repaid 100tk | repayment · সেলিম ভাই · ৳100 | | |
| 7 | নাসির কে বিশ টাকার বিস্কুট বাকি দিলাম | Nasir, 20tk biscuits, credit | credit_sale · নাসির · বিস্কুট · ৳20 | | |
| 8 | রহিমাকে তিনশো টাকা বাকি দিলাম | Rahima, 300tk credit, no item named | credit_sale · রহিমা · item null · ৳300 | | |
| 9 | সাড়ে চারশো টাকার সাবান নগদ বিক্রি | 450tk soap, cash sale (compound number — harder) | cash_sale · no customer · সাবান · ৳450 | | |
| 10 | আজকে আবহাওয়া অনেক ভালো | (irrelevant sentence — off-topic on purpose) | type: unclear, friendly re-record prompt | | |

## Score

Correct / 10 fields (customer + item + amount + type, where applicable):
_fill in after testing_

## Notes for the writeup

- Any systematic failure pattern (e.g. compound numbers, Banglish mixing)?
- Any timeout / network issue on the live proxy?
- Quotes worth using: _anything a tester said out loud about the experience_
