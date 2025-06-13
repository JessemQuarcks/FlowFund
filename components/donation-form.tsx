"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Smartphone, Building2, ArrowRight } from "lucide-react"

// export function DonationForm({ eventId }: { eventId: string }) {
//   const router = useRouter()
//   const [amount, setAmount] = useState<string>("")
//   const [customAmount, setCustomAmount] = useState<string>("")
//   const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsSubmitting(true)

//     // In a real app, this would submit to an API
//     const donationAmount = amount === "custom" ? customAmount : amount

//     console.log({
//       eventId,
//       amount: donationAmount,
//       isAnonymous,
//     })

//     // Simulate API call
//     setTimeout(() => {
//       setIsSubmitting(false)
//       // Show success message
//       alert(`Thank you for your donation of $${donationAmount}!`)

//       // Reset form
//       setAmount("")
//       setCustomAmount("")
//       setIsAnonymous(false)
//     }, 1000)
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="space-y-2">
//         <Label>Donation Amount</Label>
//         <RadioGroup
//           value={amount}
//           onValueChange={setAmount}
//           className="grid grid-cols-3 gap-2"
//         >
//           <Label
//             htmlFor="amount-25"
//             className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
//               amount === "25"
//                 ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 : "border-input"
//             }`}
//           >
//             <RadioGroupItem value="25" id="amount-25" className="sr-only" />
//             ₵25
//           </Label>
//           <Label
//             htmlFor="amount-50"
//             className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
//               amount === "50"
//                 ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 : "border-input"
//             }`}
//           >
//             <RadioGroupItem value="50" id="amount-50" className="sr-only" />
//             ₵50
//           </Label>
//           <Label
//             htmlFor="amount-100"
//             className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
//               amount === "100"
//                 ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 : "border-input"
//             }`}
//           >
//             <RadioGroupItem value="100" id="amount-100" className="sr-only" />
//             ₵100
//           </Label>
//           <Label
//             htmlFor="amount-250"
//             className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
//               amount === "250"
//                 ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 : "border-input"
//             }`}
//           >
//             <RadioGroupItem value="250" id="amount-250" className="sr-only" />
//             ₵250
//           </Label>
//           <Label
//             htmlFor="amount-500"
//             className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
//               amount === "500"
//                 ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 : "border-input"
//             }`}
//           >
//             <RadioGroupItem value="500" id="amount-500" className="sr-only" />
//             ₵500
//           </Label>
//           <Label
//             htmlFor="amount-custom"
//             className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
//               amount === "custom"
//                 ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
//                 : "border-input"
//             }`}
//           >
//             <RadioGroupItem
//               value="custom"
//               id="amount-custom"
//               className="sr-only"
//             />
//             Custom
//           </Label>
//         </RadioGroup>
//       </div>

//       {amount === "custom" && (
//         <div className="space-y-2">
//           <Label htmlFor="custom-amount">Custom Amount</Label>
//           <div className="relative">
//             <span className="absolute left-3 top-1/2 -translate-y-1/2">₵</span>
//             <Input
//               id="custom-amount"
//               type="number"
//               min="1"
//               step="1"
//               placeholder="Enter amount"
//               className="pl-7"
//               value={customAmount}
//               onChange={(e) => setCustomAmount(e.target.value)}
//               required
//             />
//           </div>
//         </div>
//       )}

//       <div className="flex items-center space-x-2">
//         <Switch
//           id="anonymous"
//           checked={isAnonymous}
//           onCheckedChange={setIsAnonymous}
//         />
//         <Label htmlFor="anonymous" className="cursor-pointer">
//           Donate anonymously
//         </Label>
//       </div>
//       <Button
//         type="submit"
//         className="w-full"
//         disabled={
//           !amount || (amount === "custom" && !customAmount) || isSubmitting
//         }
//         variant="gradient"
//         onClick={() => {
//           if (!amount || (amount === "custom" && !customAmount)) {
//             alert("Please select or enter a donation amount");
//             return;
//           }
//         }}
//       >
//         {isSubmitting ? "Processing..." : "Donate Now"}
//       </Button>
//     </form>
//   );
// }
export function DonationForm({ eventId }: { eventId: string }) {
  const [amount, setAmount] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("mobile_money")
  const [activeTab, setActiveTab] = useState("amount")
  const [donorInfo, setDonorInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [paymentDetails, setPaymentDetails] = useState({
    // Bank details
    bankCode: "",
    accountNumber: "",

    // Mobile money details
    mobileNetwork: "",
    mobileNumber: "",
  })

  const predefinedAmounts = ["10", "25", "50", "100", "250", "500"]

  // Nigerian banks for Paystack
  const nigerianBanks = [
    { code: "044", name: "Access Bank" },
    { code: "014", name: "Afribank Nigeria Plc" },
    { code: "023", name: "Citibank Nigeria Limited" },
    { code: "050", name: "Ecobank Nigeria Plc" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "070", name: "Fidelity Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "068", name: "Standard Chartered Bank" },
    { code: "232", name: "Sterling Bank" },
    { code: "032", name: "Union Bank of Nigeria" },
    { code: "033", name: "United Bank For Africa" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
  ]

  // Mobile money networks
  const mobileNetworks = [
    { code: "mtn", name: "MTN Mobile Money" },
    { code: "airtel", name: "Airtel Money" },
    { code: "glo", name: "Glo Mobile Money" },
    { code: "9mobile", name: "9mobile Money" },
  ]

  const handleAmountSelect = (selectedAmount: string) => {
    setAmount(selectedAmount)
    if (selectedAmount !== "custom") {
      setCustomAmount("")
    }
  }

  const toggleAnonymous = () => {
    setIsAnonymous(!isAnonymous)
  }

  const handleDonorInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDonorInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBankChange = (value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      bankCode: value,
    }))
  }

  const handleNetworkChange = (value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      mobileNetwork: value,
    }))
  }

  const handleNextStep = () => {
    const finalAmount = amount === "custom" ? customAmount : amount
    if (finalAmount && Number.parseFloat(finalAmount) > 0) {
      setActiveTab("payment")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const finalAmount = amount === "custom" ? customAmount : amount

    const donationData = {
      eventId,
      amount: finalAmount,
      isAnonymous,
      paymentMethod,
      donorInfo: isAnonymous ? {} : donorInfo,
      paymentDetails,
    }

    console.log("Submitting donation:", donationData)

    // Simulate Paystack integration
    setTimeout(() => {
      setIsSubmitting(false)
      // Redirect to success page with donation details
      const params = new URLSearchParams({
        amount: finalAmount,
        eventId,
        eventTitle: "Community Garden Project", // In real app, get from props
      })
      window.location.href = `/events/${eventId}/donate-success?${params.toString()}`
    }, 2000)
  }

  const isAmountValid =
    amount && (amount !== "custom" || (amount === "custom" && customAmount && Number.parseFloat(customAmount) > 0))
  // const isDonorInfoValid = isAnonymous || (donorInfo.firstName && donorInfo.lastName && donorInfo.email)
  const isPaymentValid =
    (paymentMethod === "bank" && paymentDetails.bankCode && paymentDetails.accountNumber) ||
    (paymentMethod === "mobile_money" && paymentDetails.mobileNetwork && paymentDetails.mobileNumber)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Make a Donation</CardTitle>
        <CardDescription>Support this fundraiser with a secure donation</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="amount">Amount</TabsTrigger>
            <TabsTrigger value="payment" disabled={!isAmountValid}>
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amount" className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">Donation Amount</Label>
              <div className="grid grid-cols-3 gap-3">
                {predefinedAmounts.map((value) => (
                  <div
                    key={value}
                    onClick={() => handleAmountSelect(value)}
                    className={`
                      p-3 rounded-md border text-center cursor-pointer transition-all
                      ${
                        amount === value
                          ? "border-primary-600 bg-primary-100 text-primary-700 font-medium shadow-sm dark:bg-primary-900/50 dark:text-primary-300"
                          : "border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                      }
                    `}
                  >
                    ${value}
                  </div>
                ))}
              </div>
              <div
                onClick={() => handleAmountSelect("custom")}
                className={`
                  p-3 rounded-md border text-center cursor-pointer transition-all
                  ${
                    amount === "custom"
                      ? "border-primary-600 bg-primary-100 text-primary-700 font-medium shadow-sm dark:bg-primary-900/50 dark:text-primary-300"
                      : "border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                  }
                `}
              >
                Custom Amount
              </div>
            </div>

            {amount === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Custom Amount ($)</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            )}

            <div
              className="flex items-center gap-3 p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
              onClick={toggleAnonymous}
            >
              <div
                className={`
                  w-5 h-5 rounded border flex items-center justify-center transition-colors
                  ${isAnonymous ? "bg-primary-600 border-primary-600" : "border-gray-300 dark:border-gray-600"}
                `}
              >
                {isAnonymous && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <Label className="cursor-pointer m-0">Donate anonymously</Label>
            </div>

            {/* {!isAnonymous && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Donor Information</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={donorInfo.firstName}
                      onChange={handleDonorInfoChange}
                      required={!isAnonymous}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={donorInfo.lastName}
                      onChange={handleDonorInfoChange}
                      required={!isAnonymous}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={donorInfo.email}
                    onChange={handleDonorInfoChange}
                    required={!isAnonymous}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input id="phone" name="phone" type="tel" value={donorInfo.phone} onChange={handleDonorInfoChange} />
                </div>
              </div>
            )} */}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!isAmountValid}
                className="flex items-center gap-2"
              >
                Next: Payment <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6 pt-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-xs text-muted-foreground">Pay with your mobile money account</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-md border p-3">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-xs text-muted-foreground">Pay directly from your bank account</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "mobile_money" && (
              <div className="space-y-4 border rounded-md p-4 bg-primary-50/30 dark:bg-primary-900/10">
                <div className="space-y-2">
                  <Label htmlFor="mobileNetwork">Mobile Network *</Label>
                  <Select value={paymentDetails.mobileNetwork} onValueChange={handleNetworkChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {mobileNetworks.map((network) => (
                        <SelectItem key={network.code} value={network.code}>
                          {network.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="08012345678"
                    value={paymentDetails.mobileNumber}
                    onChange={handlePaymentDetailsChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the mobile number registered with your mobile money account
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="space-y-4 border rounded-md p-4 bg-primary-50/30 dark:bg-primary-900/10">
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Select Your Bank *</Label>
                  <Select value={paymentDetails.bankCode} onValueChange={handleBankChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {nigerianBanks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    placeholder="Enter your account number"
                    value={paymentDetails.accountNumber}
                    onChange={handlePaymentDetailsChange}
                  />
                  <p className="text-xs text-muted-foreground">Your 10-digit bank account number (NUBAN)</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("amount")}>
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!isPaymentValid || isSubmitting}
                  variant="gradient"
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Processing..." : `Donate $${amount === "custom" ? customAmount : amount}`}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
