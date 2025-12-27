import { Link } from '@heroui/react'
import { Facebook, Github } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 flex flex-col md:flex-row items-center justify-between border-t border-divider bg-background/60 backdrop-blur-md">
      <div className="text-small text-default-500">
        Created by <span className="font-semibold text-primary">@minhchi1509</span>
      </div>
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        <Link
          isExternal
          href="https://www.facebook.com/minhchi1509"
          className="text-default-500 hover:text-blue-600 transition-colors"
        >
          <Facebook size={20} />
        </Link>
        <Link
          isExternal
          href="https://github.com/minhchi1509"
          className="text-default-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <Github size={20} />
        </Link>
      </div>
    </footer>
  )
}

export default Footer
