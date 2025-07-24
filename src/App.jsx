import './App.css'
import { useEffect, useState } from 'react'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ensureSchemaUpToDate } from '@/utils/schemaManager'
import { toast } from "@/components/ui/use-toast"
import initializeLogging from '@/services/LoggingInitializer'

function App() {
  const [schemaChecked, setSchemaChecked] = useState(false);
  
  useEffect(() => {
    // Initialize logging system
    initializeLogging();
    
    // Check and update the schema when the application starts
    const checkSchema = async () => {
      try {
        const isSchemaUpToDate = await ensureSchemaUpToDate();
        
        if (isSchemaUpToDate) {
          console.log('Database schema is up to date');
        } else {
          console.warn('Failed to update database schema');
          toast({
            title: "Schema Update Warning",
            description: "Some features may not work correctly due to database schema issues.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking schema:', error);
      } finally {
        setSchemaChecked(true);
      }
    };
    
    checkSchema();
  }, []);
  
  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App 