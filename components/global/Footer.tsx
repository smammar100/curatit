import Logo from "@/components/assets/Logo";
import Symbol from "@/components/assets/Symbol";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";

export default function Footer() {
  return (
    <footer className="bg-base-50 overflow-hidden">
      <Wrapper className="py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-balance">
            <Symbol className="inline-block size-12 text-base-900" />
            <Text
              tag="h3"
              variant="displayLG"
              className="text-base-900 font-display font-light mt-12"
            >
              Stay connected to the future of Curatit
            </Text>
          </div>
          <form className="flex flex-col gap-2 max-w-md mx-auto items-start sm:items-center mt-8">
            <label className="sr-only" htmlFor="footer-email">
              Email address
            </label>
            <input
              id="footer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
              required
            />
            <Button size="sm" variant="accent" type="submit" className="w-full">
              Subscribe
            </Button>
          </form>
          <div className="flex flex-wrap gap-4 mt-12 justify-center">
            <a href="#_" className="text-base-600 hover:text-accent-600">
              Twitter
            </a>
            <a href="#_" className="text-base-600 hover:text-accent-600">
              Pinterest
            </a>
            <a href="#_" className="text-base-600 hover:text-accent-600">
              Instagram
            </a>
          </div>
        </div>
      </Wrapper>
      <Logo className="text-base-100 mt-8 -mx-24 -mb-24" />
    </footer>
  );
}
